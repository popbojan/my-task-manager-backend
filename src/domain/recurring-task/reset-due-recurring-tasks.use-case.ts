import type { FindDueRecurringTasksActivity } from "./activity/find-due-recurring-tasks.activity";
import type { BuildRecurringTaskResetUpdateActivity } from "./activity/build-recurring-task-reset-update.activity";
import type { BuildRecurringTaskProgressUpdatesActivity } from "./activity/build-recurring-task-progress-updates.activity";
import type { ResetDueRecurringTasksActivity } from "./activity/reset-due-recurring-tasks.activity";

export class ResetDueRecurringTasksUseCase {
    constructor(
        private readonly findDueRecurringTasksActivity: FindDueRecurringTasksActivity,
        private readonly buildRecurringTaskResetUpdateActivity: BuildRecurringTaskResetUpdateActivity,
        private readonly buildRecurringTaskProgressUpdatesActivity: BuildRecurringTaskProgressUpdatesActivity,
        private readonly resetDueRecurringTasksActivity: ResetDueRecurringTasksActivity,
    ) {}

    async execute(asOf: Date = new Date()) {
        console.log(
            "ResetDueRecurringTasksUseCase.execute",
            asOf.toISOString(),
        );
        const dueTasks = await this.findDueRecurringTasksActivity.execute(asOf);

        const taskUpdates = dueTasks.map((task) =>
            this.buildRecurringTaskResetUpdateActivity.execute(task, asOf),
        );

        const progressUpdates =
            await this.buildRecurringTaskProgressUpdatesActivity.execute(
                dueTasks,
                asOf,
            );

        return this.resetDueRecurringTasksActivity.execute({
            taskUpdates,
            progressUpdates,
        });
    }
}