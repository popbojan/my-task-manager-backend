import type { RecurringTaskPort } from "../port/recurring-task.port";
import type { UpdateRecurringTaskInput } from "../model/update-recurring-task-input";

export class UpdateRecurringTaskActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(input: UpdateRecurringTaskInput) {
        return this.recurringTaskPort.update(input);
    }
}
