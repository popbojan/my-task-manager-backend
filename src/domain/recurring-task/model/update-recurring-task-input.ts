import type { RecurringFrequency, RecurringTaskStatus } from "./recurring-task";

export type UpdateRecurringTaskInput = {
    recurringTaskId: string;
    email: string;
    title?: string;
    description?: string | null;
    status?: RecurringTaskStatus;
    frequency?: RecurringFrequency;
    streakCount?: number;
    lastCompletedAt?: Date;
    nextResetAt?: Date;
};
