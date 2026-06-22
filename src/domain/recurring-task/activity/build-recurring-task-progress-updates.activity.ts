import type { RecurringTask } from "../model/recurring-task";
import type { UpdateRecurringTaskProgressInput } from "../model/update-recurring-task-progress-input";
import type { RecurringTaskPort } from "../port/recurring-task.port";
import type { AreAllDailyTasksDoneActivity } from "./are-all-daily-tasks-done.activity";

export class BuildRecurringTaskProgressUpdatesActivity {
    constructor(
        private readonly recurringTaskPort: RecurringTaskPort,
        private readonly areAllDailyTasksDoneActivity: AreAllDailyTasksDoneActivity,
    ) {}

    async execute(
        dueTasks: RecurringTask[],
        asOf: Date,
    ): Promise<UpdateRecurringTaskProgressInput[]> {
        const affectedUserIds = [...new Set(dueTasks.map((task) => task.userId))];
        const updates: UpdateRecurringTaskProgressInput[] = [];

        for (const userId of affectedUserIds) {
            const dailyTasks = await this.recurringTaskPort.findDailyByUserId(userId);

            if (dailyTasks.length === 0) {
                continue;
            }

            const progress = await this.recurringTaskPort.getOrCreateProgress(userId);

            updates.push({
                userId,
                allTasksStreak: this.areAllDailyTasksDoneActivity.execute(dailyTasks)
                    ? progress.allTasksStreak + 1
                    : 0,
                lastCheckedAt: asOf,
            });
        }

        return updates;
    }
}