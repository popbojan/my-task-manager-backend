import type { RecurringTaskPort } from "../port/recurring-task.port";
import type { ResetDueRecurringTasksInput } from "../model/reset-due-recurring-tasks-input";

export class ResetDueRecurringTasksActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(input: ResetDueRecurringTasksInput) {
        return this.recurringTaskPort.resetDueRecurringTasks(input);
    }
}