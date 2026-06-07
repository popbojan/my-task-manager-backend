import type { FindDueRecurringTasksActivity } from "./activity/find-due-recurring-tasks.activity";
import type { BuildRecurringTaskResetUpdateActivity } from "./activity/build-recurring-task-reset-update.activity";
import type { BuildRecurringTaskProgressUpdatesActivity } from "./activity/build-recurring-task-progress-updates.activity";
import type { ResetDueRecurringTasksActivity } from "./activity/reset-due-recurring-tasks.activity";
import type { GetCurrentTimeInTimezoneActivity } from "./activity/get-current-time-in-timezone.activity";

export class ResetDueRecurringTasksUseCase {
    constructor(
        private readonly findDueRecurringTasksActivity: FindDueRecurringTasksActivity,
        private readonly buildRecurringTaskResetUpdateActivity: BuildRecurringTaskResetUpdateActivity,
        private readonly buildRecurringTaskProgressUpdatesActivity: BuildRecurringTaskProgressUpdatesActivity,
        private readonly resetDueRecurringTasksActivity: ResetDueRecurringTasksActivity,
        private readonly getCurrentTimeInTimezoneActivity: GetCurrentTimeInTimezoneActivity,
    ) {}

    async execute() {
        const resetAt = this.getCurrentTimeInTimezoneActivity.execute();
        const dueTasks = await this.findDueRecurringTasksActivity.execute(resetAt);

        const taskUpdates = dueTasks.map((task) =>
            this.buildRecurringTaskResetUpdateActivity.execute(task, resetAt),
        );

        const progressUpdates =
            await this.buildRecurringTaskProgressUpdatesActivity.execute(
                dueTasks,
                resetAt,
            );

        return this.resetDueRecurringTasksActivity.execute({
            taskUpdates,
            progressUpdates,
        });
    }
}
