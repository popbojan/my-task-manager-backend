import type { PrismaClient, TaskPriority, TaskStatus } from "@prisma/client";
import { DEFAULT_TEST_LANGUAGE } from "./test-auth-payload.js";

type TestLanguage = "en" | "de" | "sr";

type CreateTaskData = {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: Date | null;
};

export async function ensureUser(
    prisma: PrismaClient,
    email: string,
    language: TestLanguage = DEFAULT_TEST_LANGUAGE,
) {
    return prisma.user.upsert({
        where: { email },
        create: { email, language },
        update: { language },
    });
}

export async function createTaskForEmail(
    prisma: PrismaClient,
    email: string,
    data: CreateTaskData,
) {
    const user = await ensureUser(prisma, email);

    return prisma.task.create({
        data: {
            userId: user.id,
            title: data.title,
            description: data.description ?? null,
            status: data.status ?? "todo",
            priority: data.priority ?? "none",
            deadline: data.deadline ?? null,
        },
        include: { user: true },
    });
}

export async function findProgressByEmail(prisma: PrismaClient, email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return null;
    }

    return prisma.recurringTaskProgress.findUnique({
        where: { userId: user.id },
    });
}

export async function updateRecurringTasksNextResetAtForEmail(
    prisma: PrismaClient,
    email: string,
    nextResetAt: Date,
) {
    const user = await ensureUser(prisma, email);

    return prisma.recurringTask.updateMany({
        where: { userId: user.id },
        data: { nextResetAt },
    });
}

export async function createProgressForEmail(
    prisma: PrismaClient,
    email: string,
    data: { allTasksStreak: number },
) {
    const user = await ensureUser(prisma, email);

    return prisma.recurringTaskProgress.create({
        data: {
            userId: user.id,
            allTasksStreak: data.allTasksStreak,
        },
    });
}
