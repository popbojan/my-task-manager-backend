import type { GetRecurringTaskByIdActivity } from "./activity/get-recurring-task-by-id.activity";
import type { GetRecurringTaskByIdInput } from "./model/get-recurring-task-by-id-input";

export class GetRecurringTaskByIdUseCase {
    constructor(private readonly getRecurringTaskByIdActivity: GetRecurringTaskByIdActivity) {}

    async execute(input: GetRecurringTaskByIdInput) {
        return this.getRecurringTaskByIdActivity.execute(input);
    }
}
