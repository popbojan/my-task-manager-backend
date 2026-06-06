import type { UpdateRecurringTaskInput } from "./update-recurring-task-input";
import type { UpdateRecurringTaskProgressInput } from "./update-recurring-task-progress-input";

export type ResetDueRecurringTasksInput = {
    taskUpdates: UpdateRecurringTaskInput[];
    progressUpdates: UpdateRecurringTaskProgressInput[];
};