import type { Prisma, PrismaClient } from "@prisma/client";
import type { RecurringTaskPort } from "../../../domain/recurring-task/port/recurring-task.port";
import type { CreateRecurringTaskInput } from "../../../domain/recurring-task/model/create-recurring-task-input";
import type { UpdateRecurringTaskInput } from "../../../domain/recurring-task/model/update-recurring-task-input";
import type { UpdateRecurringTaskProgressInput } from "../../../domain/recurring-task/model/update-recurring-task-progress-input";
import type { ResolveAllTasksStreakActivity } from "../../../domain/recurring-task/activity/resolve-all-tasks-streak.activity";
import type {ResetDueRecurringTasksResult} from "../../../domain/recurring-task/model/reset-due-recurring-tasks-result";

type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class PrismaRecurringTaskAdapter implements RecurringTaskPort {
    constructor(
        private readonly prisma: PrismaDb,
        private readonly resolveAllTasksStreakActivity: ResolveAllTasksStreakActivity,
    ) {}

    async findByEmail(email: string) {
        return this.prisma.recurringTask.findMany({
            where: { email },
            orderBy: { createdAt: "desc" },
        });
    }

    async findDailyByEmail(email: string) {
        return this.prisma.recurringTask.findMany({
            where: { email, frequency: "daily" },
            orderBy: { createdAt: "desc" },
        });
    }

    async findDueForReset(asOf: Date) {
        return await this.prisma.recurringTask.findMany({
            where: {
                nextResetAt: {
                    lte: asOf,
                },
            },
            orderBy: {
                nextResetAt: "asc",
            },
        });
    }

    async findById(recurringTaskId: string) {
        return this.prisma.recurringTask.findUnique({
            where: { id: recurringTaskId },
        });
    }

    async create(input: CreateRecurringTaskInput) {
        return this.prisma.recurringTask.create({
            data: input,
        });
    }

    async update(input: UpdateRecurringTaskInput) {
        const {
            recurringTaskId,
            email: _discardedOwnerEmail,
            title,
            description,
            status,
            frequency,
            streakCount,
            lastCompletedAt,
            lastResetAt,
            nextResetAt,
        } = input;

        return this.prisma.recurringTask.update({
            where: {
                id: recurringTaskId,
            },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(frequency !== undefined && { frequency }),
                ...(streakCount !== undefined && { streakCount }),
                ...(lastCompletedAt !== undefined && { lastCompletedAt }),
                ...(lastResetAt !== undefined && { lastResetAt }),
                ...(nextResetAt !== undefined && { nextResetAt }),
            },
        });
    }

    async delete(recurringTaskId: string): Promise<void> {
        await this.prisma.recurringTask.delete({
            where: { id: recurringTaskId },
        });
    }

    async findProgressByEmail(email: string) {
        return this.prisma.recurringTaskProgress.findUnique({
            where: { email },
        });
    }

    async getOrCreateProgress(email: string) {
        const existing = await this.findProgressByEmail(email);

        if (existing) {
            return existing;
        }

        return this.prisma.recurringTaskProgress.create({
            data: { email },
        });
    }

    async updateProgress(email: string, input: UpdateRecurringTaskProgressInput) {
        return this.prisma.recurringTaskProgress.upsert({
            where: { email },
            create: {
                email,
                allTasksStreak: input.allTasksStreak,
                lastCheckedAt: input.lastCheckedAt,
            },
            update: {
                allTasksStreak: input.allTasksStreak,
                lastCheckedAt: input.lastCheckedAt,
            },
        });
    }

    async resetDueRecurringTasks(input: {
        taskUpdates: UpdateRecurringTaskInput[];
        progressUpdates: UpdateRecurringTaskProgressInput[];
    }): Promise<ResetDueRecurringTasksResult> {
        return this.prisma.$transaction(async (tx) => {
            for (const progressUpdate of input.progressUpdates) {
                await tx.recurringTaskProgress.upsert({
                    where: {
                        email: progressUpdate.email,
                    },
                    create: {
                        email: progressUpdate.email,
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
                affectedEmails: [
                    ...new Set(input.taskUpdates.map((task) => task.email)),
                ],
            };
        });
    }
}
