import type { RecurringTaskPort } from "../port/recurring-task.port";

export class DeleteRecurringTaskActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(recurringTaskId: string) {
        return this.recurringTaskPort.delete(recurringTaskId);
    }
}
