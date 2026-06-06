export type RecurringTaskStatus = "todo" | "in_progress" | "done";
export type RecurringFrequency = "daily" | "weekly" | "monthly";

export type RecurringTask = {
    id: string;
    title: string;
    description: string | null;
    status: RecurringTaskStatus;
    frequency: RecurringFrequency;
    streakCount: number;
    lastCompletedAt: Date | null;
    lastResetAt: Date | null;
    nextResetAt: Date;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};

export type RecurringTaskProgress = {
    id: string;
    email: string;
    allTasksStreak: number;
    lastCheckedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
