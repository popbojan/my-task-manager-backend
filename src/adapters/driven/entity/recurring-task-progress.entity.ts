export type RecurringTaskProgressEntity = {
    id: string;
    userId: string;
    allTasksStreak: number;
    lastCheckedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
