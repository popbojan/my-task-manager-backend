import type { RecurringFrequency, RecurringTaskStatus } from "./recurring-task";

export type UpdateRecurringTaskInput = {
    recurringTaskId: string;
    userId: string;
    title?: string;
    description?: string | null;
    status?: RecurringTaskStatus;
    frequency?: RecurringFrequency;
    streakCount?: number;
    lastCompletedAt?: Date | null | undefined;
    lastResetAt?: Date | undefined;
    nextResetAt?: Date | undefined;
};
