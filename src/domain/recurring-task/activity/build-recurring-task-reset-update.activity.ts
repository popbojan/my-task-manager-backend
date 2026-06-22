import type { RecurringTask } from "../model/recurring-task";
import type { UpdateRecurringTaskInput } from "../model/update-recurring-task-input";
import type { CalculateNextResetAtActivity } from "./calculate-next-reset-at.activity";

export class BuildRecurringTaskResetUpdateActivity {
    constructor(
        private readonly calculateNextResetAtActivity: CalculateNextResetAtActivity,
    ) {}

    execute(task: RecurringTask, asOf: Date): UpdateRecurringTaskInput {
        return {
            recurringTaskId: task.id,
            userId: task.userId,
            status: "todo",
            lastResetAt: asOf,
            nextResetAt: this.calculateNextResetAtActivity.execute(
                task.frequency,
                asOf,
            ),
            ...(task.status !== "done" && { streakCount: 0 }),
        };
    }
}