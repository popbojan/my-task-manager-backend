import type { RecurringTaskPort } from "../port/recurring-task.port";

export class FindDueRecurringTasksActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(asOf: Date) {
        return this.recurringTaskPort.findDueForReset(asOf);
    }
}