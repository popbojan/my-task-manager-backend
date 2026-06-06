import type { RecurringTaskPort } from "../port/recurring-task.port";

export class GetRecurringTaskProgressActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(email: string) {
        return this.recurringTaskPort.getOrCreateProgress(email);
    }
}
