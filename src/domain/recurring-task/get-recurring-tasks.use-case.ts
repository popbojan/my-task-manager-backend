import type { GetRelevantRecurringTaskActivity } from "./activity/get-relevant-recurring-task.activity";

export class GetRecurringTasksUseCase {
    constructor(
        private readonly getRelevantRecurringTaskActivity: GetRelevantRecurringTaskActivity,
    ) {}

    async execute(email: string) {
        return this.getRelevantRecurringTaskActivity.execute(email);
    }
}
