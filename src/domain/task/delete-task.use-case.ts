import type {GetTaskByIdActivity} from "./activity/get-task-by-id.activity.js";
import type {DeleteTaskActivity} from "./activity/delete-task.activity.js";
import type {DeleteTaskInput} from "./model/delete-task-input.js";

export class DeleteTaskUseCase {
    constructor(
        private readonly getTaskByIdActivity: GetTaskByIdActivity,
        private readonly deleteTaskActivity: DeleteTaskActivity
    ) {}

    async execute(input: DeleteTaskInput): Promise<void> {
        const task = await this.getTaskByIdActivity.execute({
            taskId: input.taskId,
            email: input.email,
        });

        if (!task) {
            return;
        }

        await this.deleteTaskActivity.execute(task.id);
    }
}