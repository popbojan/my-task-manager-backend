import type { GetRecurringTaskByIdActivity } from "./activity/get-recurring-task-by-id.activity";
import type { UpdateRecurringTaskActivity } from "./activity/update-recurring-task.activity";
import type { AdjustStreakOnStatusChangeActivity } from "./activity/adjust-streak-on-status-change.activity";
import type { CalculateNextResetAtActivity } from "./activity/calculate-next-reset-at.activity";
import type { UpdateRecurringTaskInput } from "./model/update-recurring-task-input";

export class UpdateRecurringTaskUseCase {
    constructor(
        private readonly getRecurringTaskByIdActivity: GetRecurringTaskByIdActivity,
        private readonly updateRecurringTaskActivity: UpdateRecurringTaskActivity,
        private readonly adjustStreakOnStatusChangeActivity: AdjustStreakOnStatusChangeActivity,
        private readonly calculateNextResetAtActivity: CalculateNextResetAtActivity,
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

        const nextStreak = this.adjustStreakOnStatusChangeActivity.execute(
            recurringTask.status,
            input.status,
            recurringTask.streakCount,
        );

        if (nextStreak !== undefined) {
            enrichedInput.streakCount = nextStreak;
            enrichedInput.lastCompletedAt =
                input.status === "done" ? new Date() : null;
        }

        if (
            input.frequency !== undefined &&
            input.frequency !== recurringTask.frequency
        ) {
            enrichedInput.nextResetAt =
                this.calculateNextResetAtActivity.execute(input.frequency);
        }

        return this.updateRecurringTaskActivity.execute(enrichedInput);
    }
}