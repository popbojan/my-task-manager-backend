import type { CreateRecurringTaskActivity } from "./activity/create-recurring-task.activity";
import type { CalculateNextResetAtActivity } from "./activity/calculate-next-reset-at.activity";
import type { CreateRecurringTaskInput } from "./model/create-recurring-task-input";

export class CreateRecurringTaskUseCase {
    constructor(
        private readonly createRecurringTaskActivity: CreateRecurringTaskActivity,
        private readonly calculateNextResetAtActivity: CalculateNextResetAtActivity,
    ) {}

    async execute(input: Omit<CreateRecurringTaskInput, "nextResetAt">) {
        return this.createRecurringTaskActivity.execute({
            ...input,
            nextResetAt: this.calculateNextResetAtActivity.execute(input.frequency),
        });
    }
}
