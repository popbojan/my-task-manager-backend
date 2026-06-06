import type { RecurringTaskStatus } from "../model/recurring-task";

export class AreAllDailyTasksDoneActivity {
    execute(dailyTasks: Array<{ status: RecurringTaskStatus }>): boolean {
        return dailyTasks.length > 0 && dailyTasks.every((task) => task.status === "done");
    }
}
