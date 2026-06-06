import type { RecurringTaskPort } from "../port/recurring-task.port";
import type { CreateRecurringTaskInput } from "../model/create-recurring-task-input";

export class CreateRecurringTaskActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(input: CreateRecurringTaskInput) {
        return this.recurringTaskPort.create(input);
    }
}
