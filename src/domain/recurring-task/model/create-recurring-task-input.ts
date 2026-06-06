import type { RecurringFrequency } from "./recurring-task";

export type CreateRecurringTaskInput = {
    email: string;
    title: string;
    description: string | null;
    frequency: RecurringFrequency;
    nextResetAt: Date;
};
