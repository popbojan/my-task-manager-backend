import type { GetRecurringTaskProgressActivity } from "./activity/get-recurring-task-progress.activity";

export class GetRecurringTaskProgressUseCase {
    constructor(
        private readonly getRecurringTaskProgressActivity: GetRecurringTaskProgressActivity,
    ) {}

    async execute(email: string) {
        return this.getRecurringTaskProgressActivity.execute(email);
    }
}
