import type { RecurringTaskStatus } from "../model/recurring-task";

export class ResolveAllTasksStreakActivity {
    execute(
        dailyTasks: Array<{ status: RecurringTaskStatus }>,
        currentStreak: number,
    ): number {
        if (dailyTasks.length === 0) {
            return currentStreak;
        }

        const allDone = dailyTasks.every((task) => task.status === "done");

        return allDone ? currentStreak + 1 : 0;
    }
}
