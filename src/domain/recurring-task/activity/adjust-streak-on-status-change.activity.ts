import type { RecurringTaskStatus } from "../model/recurring-task";

export class AdjustStreakOnStatusChangeActivity {
    execute(
        previousStatus: RecurringTaskStatus,
        nextStatus: RecurringTaskStatus | undefined,
        currentStreak: number,
    ): number | undefined {
        if (nextStatus === "done" && previousStatus !== "done") {
            return currentStreak + 1;
        }

        if (previousStatus === "done" && nextStatus !== undefined && nextStatus !== "done") {
            return Math.max(0, currentStreak - 1);
        }

        return undefined;
    }
}
