import type { GetRecurringTaskByIdActivity } from "./activity/get-recurring-task-by-id.activity";
import type { DeleteRecurringTaskActivity } from "./activity/delete-recurring-task.activity";
import type { DeleteRecurringTaskInput } from "./model/delete-recurring-task-input";

export class DeleteRecurringTaskUseCase {
    constructor(
        private readonly getRecurringTaskByIdActivity: GetRecurringTaskByIdActivity,
        private readonly deleteRecurringTaskActivity: DeleteRecurringTaskActivity,
    ) {}

    async execute(input: DeleteRecurringTaskInput): Promise<void> {
        const recurringTask = await this.getRecurringTaskByIdActivity.execute({
            recurringTaskId: input.recurringTaskId,
            userId: input.userId,
        });

        if (!recurringTask) {
            return;
        }

        await this.deleteRecurringTaskActivity.execute(recurringTask.id);
    }
}
