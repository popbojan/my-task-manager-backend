import type { Prisma, PrismaClient } from "@prisma/client";
import type { RecurringTaskPort } from "../../../domain/recurring-task/port/recurring-task.port";
import type { CreateRecurringTaskInput } from "../../../domain/recurring-task/model/create-recurring-task-input";
import type { UpdateRecurringTaskInput } from "../../../domain/recurring-task/model/update-recurring-task-input";
import type { UpdateRecurringTaskProgressInput } from "../../../domain/recurring-task/model/update-recurring-task-progress-input";
import type { ResolveAllTasksStreakActivity } from "../../../domain/recurring-task/activity/resolve-all-tasks-streak.activity";
import type { ResetDueRecurringTasksResult } from "../../../domain/recurring-task/model/reset-due-recurring-tasks-result";
import { mapRecurringTaskProgress } from "../mapper/recurring-task-progress.mapper";
import { mapRecurringTask } from "../mapper/recurring-task.mapper";

type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class PrismaRecurringTaskAdapter implements RecurringTaskPort {
    constructor(
        private readonly prisma: PrismaDb,
        private readonly resolveAllTasksStreakActivity: ResolveAllTasksStreakActivity,
    ) {
    }

    async findByUserId(userId: string) {
        const user = await this.findUserByUserId(userId);

        if (!user) {
            return [];
        }

        const recurringTasks = await this.prisma.recurringTask.findMany({
            where: {userId: user.id},
            include: {user: true},
            orderBy: {createdAt: "desc"},
        });

        return recurringTasks.map((task) => mapRecurringTask(task));
    }

    async findDailyByUserId(userId: string) {
        const user = await this.findUserByUserId(userId);

        if (!user) {
            return [];
        }

        const recurringTasks = await this.prisma.recurringTask.findMany({
            where: {userId: user.id, frequency: "daily"},
            include: {user: true},
            orderBy: {createdAt: "desc"},
        });

        return recurringTasks.map((task) => mapRecurringTask(task));
    }

    async findDueForReset(asOf: Date) {
        const recurringTasks = await this.prisma.recurringTask.findMany({
            where: {
                nextResetAt: {
                    lte: asOf,
                },
            },
            include: { user: true },
            orderBy: {
                nextResetAt: "asc",
            },
        });

        return recurringTasks.map((task) => mapRecurringTask(task));
    }

    async findById(recurringTaskId: string) {
        const recurringTask = await this.prisma.recurringTask.findUnique({
            where: {id: recurringTaskId},
            include: {user: true},
        });

        if (!recurringTask) {
            return null;
        }

        return mapRecurringTask(recurringTask);
    }

    async create(input: CreateRecurringTaskInput) {
        const recurringTask = await this.prisma.recurringTask.create({
            data: {
                userId: input.userId,
                title: input.title,
                description: input.description,
                frequency: input.frequency,
                nextResetAt: input.nextResetAt,
            },
            include: {user: true},
        });

        return mapRecurringTask(recurringTask);
    }

    async update(input: UpdateRecurringTaskInput) {
        const {
            recurringTaskId,
            title,
            description,
            status,
            frequency,
            streakCount,
            lastCompletedAt,
            lastResetAt,
            nextResetAt,
        } = input;

        const recurringTask = await this.prisma.recurringTask.update({
            where: {
                id: recurringTaskId,
            },
            data: {
                ...(title !== undefined && {title}),
                ...(description !== undefined && {description}),
                ...(status !== undefined && {status}),
                ...(frequency !== undefined && {frequency}),
                ...(streakCount !== undefined && {streakCount}),
                ...(lastCompletedAt !== undefined && {lastCompletedAt}),
                ...(lastResetAt !== undefined && {lastResetAt}),
                ...(nextResetAt !== undefined && {nextResetAt}),
            },
            include: {user: true},
        });

        return mapRecurringTask(recurringTask);
    }

    async delete(recurringTaskId: string): Promise<void> {
        await this.prisma.recurringTask.delete({
            where: {id: recurringTaskId},
        });
    }

    async getOrCreateProgress(userId: string) {
        const progress = await this.prisma.recurringTaskProgress.upsert({
            where: {userId: userId},
            create: {userId: userId},
            update: {},
            include: {user: true},
        });

        return mapRecurringTaskProgress(progress);
    }

    async resetDueRecurringTasks(input: {
        taskUpdates: UpdateRecurringTaskInput[];
        progressUpdates: UpdateRecurringTaskProgressInput[];
    }): Promise<ResetDueRecurringTasksResult> {
        return this.prisma.$transaction(async (tx) => {
            for (const progressUpdate of input.progressUpdates) {

                await tx.recurringTaskProgress.upsert({
                    where: {
                        userId: progressUpdate.userId,
                    },
                    create: {
                        userId: progressUpdate.userId,
                        allTasksStreak: progressUpdate.allTasksStreak,
                        lastCheckedAt: progressUpdate.lastCheckedAt,
                    },
                    update: {
                        allTasksStreak: progressUpdate.allTasksStreak,
                        lastCheckedAt: progressUpdate.lastCheckedAt,
                    },
                });
            }

            for (const taskUpdate of input.taskUpdates) {
                await tx.recurringTask.update({
                    where: {
                        id: taskUpdate.recurringTaskId,
                    },
                    data: {
                        ...(taskUpdate.status !== undefined && {
                            status: taskUpdate.status,
                        }),
                        ...(taskUpdate.streakCount !== undefined && {
                            streakCount: taskUpdate.streakCount,
                        }),
                        ...(taskUpdate.lastResetAt !== undefined && {
                            lastResetAt: taskUpdate.lastResetAt,
                        }),
                        ...(taskUpdate.nextResetAt !== undefined && {
                            nextResetAt: taskUpdate.nextResetAt,
                        }),
                    },
                });
            }

            return {
                resetTaskCount: input.taskUpdates.length,
                affectedUserIds: [
                    ...new Set([
                        ...input.taskUpdates.map((task) => task.userId),
                        ...input.progressUpdates.map((progress) => progress.userId),
                    ]),
                ],
            };
        });
    }

    private async findUserByUserId(userId: string) {
        return this.prisma.user.findUnique({
            where: {id: userId},
        });
    }
}
