import type { GetRecurringTaskByIdActivity } from "./activity/get-recurring-task-by-id.activity";
import type { UpdateRecurringTaskActivity } from "./activity/update-recurring-task.activity";
import type { UpdateRecurringTaskInput } from "./model/update-recurring-task-input";
import { calculateNextResetAt } from "./utility/calculate-next-reset-at";

export class UpdateRecurringTaskUseCase {
    constructor(
        private readonly getRecurringTaskByIdActivity: GetRecurringTaskByIdActivity,
        private readonly updateRecurringTaskActivity: UpdateRecurringTaskActivity,
    ) {}

    async execute(input: UpdateRecurringTaskInput) {
        const recurringTask = await this.getRecurringTaskByIdActivity.execute({
            recurringTaskId: input.recurringTaskId,
            email: input.email,
        });

        if (!recurringTask) {
            return null;
        }

        const enrichedInput: UpdateRecurringTaskInput = { ...input };

        if (
            input.frequency !== undefined &&
            input.frequency !== recurringTask.frequency
        ) {
            enrichedInput.nextResetAt = calculateNextResetAt(input.frequency);
        }

        if (input.status === "done" && recurringTask.status !== "done") {
            enrichedInput.lastCompletedAt = new Date();
            enrichedInput.streakCount = recurringTask.streakCount + 1;
        }

        return this.updateRecurringTaskActivity.execute(enrichedInput);
    }
}
