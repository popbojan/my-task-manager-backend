import type { RecurringFrequency } from "../model/recurring-task";

export function calculateNextResetAt(
    frequency: RecurringFrequency,
    from: Date = new Date(),
): Date {
    const resetAt = new Date(from);
    resetAt.setUTCHours(0, 0, 0, 0);

    switch (frequency) {
        case "daily":
            resetAt.setUTCDate(resetAt.getUTCDate() + 1);
            return resetAt;
        case "weekly": {
            const day = from.getUTCDay();
            const daysUntilMonday = day === 0 ? 1 : 8 - day;
            resetAt.setUTCDate(resetAt.getUTCDate() + daysUntilMonday);
            return resetAt;
        }
        case "monthly":
            resetAt.setUTCMonth(resetAt.getUTCMonth() + 1, 1);
            return resetAt;
    }
}
