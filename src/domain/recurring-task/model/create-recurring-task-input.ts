import type { RecurringFrequency } from "./recurring-task";

export type CreateRecurringTaskInput = {
    userId: string;
    title: string;
    description: string | null;
    frequency: RecurringFrequency;
    nextResetAt: Date;
};
