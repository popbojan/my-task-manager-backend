import type { RecurringTaskPort } from "../port/recurring-task.port";
import type { RecurringTask } from "../model/recurring-task";

export class GetRelevantRecurringTaskActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(userId: string): Promise<RecurringTask[]> {
        return this.recurringTaskPort.findByUserId(userId);
    }
}
