import type { PrismaClient, RecurringFrequency, RecurringTaskStatus } from "@prisma/client";
import { CalculateNextResetAtActivity } from "../../src/domain/recurring-task/activity/calculate-next-reset-at.activity.js";
import { ensureUser } from "./user-prisma-helper.js";

const calculateNextResetAtActivity = new CalculateNextResetAtActivity();

type CreateRecurringTaskData = {
    title: string;
    description?: string | null;
    status?: RecurringTaskStatus;
    frequency?: RecurringFrequency;
    streakCount?: number;
    nextResetAt?: Date;
};

export async function createRecurringTaskForEmail(
    prisma: PrismaClient,
    email: string,
    data: CreateRecurringTaskData,
) {
    const user = await ensureUser(prisma, email);
    const frequency = data.frequency ?? "daily";
    const nextResetAt = data.nextResetAt ?? calculateNextResetAtActivity.execute(frequency);

    return prisma.recurringTask.create({
        data: {
            userId: user.id,
            title: data.title,
            description: data.description ?? null,
            status: data.status ?? "todo",
            frequency,
            streakCount: data.streakCount ?? 0,
            nextResetAt,
        },
        include: { user: true },
    });
}
