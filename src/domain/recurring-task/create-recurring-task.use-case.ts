import type { CreateRecurringTaskActivity } from "./activity/create-recurring-task.activity";
import type { CreateRecurringTaskInput } from "./model/create-recurring-task-input";
import { calculateNextResetAt } from "./utility/calculate-next-reset-at";

export class CreateRecurringTaskUseCase {
    constructor(private readonly createRecurringTaskActivity: CreateRecurringTaskActivity) {}

    async execute(input: Omit<CreateRecurringTaskInput, "nextResetAt">) {
        return this.createRecurringTaskActivity.execute({
            ...input,
            nextResetAt: calculateNextResetAt(input.frequency),
        });
    }
}
