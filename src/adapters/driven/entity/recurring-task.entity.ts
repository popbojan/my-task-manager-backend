import type {RecurringTask} from "../../../domain/recurring-task/model/recurring-task";

export type RecurringTaskEntity = {
    id: string;
    title: string;
    description: string | null;
    status: RecurringTask["status"];
    frequency: RecurringTask["frequency"];
    streakCount: number;
    lastCompletedAt: Date | null;
    lastResetAt: Date | null;
    nextResetAt: Date;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};