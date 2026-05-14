import type { UpdateTaskActivity } from "./activity/update-task.activity.js";
import type {UpdateTaskInput} from "./model/udate-task-input";
import type {GetTaskByIdActivity} from "./activity/get-task-by-id.activity";

export class UpdateTaskUseCase {
    constructor(
        private readonly getTaskByIdActivity: GetTaskByIdActivity,
        private readonly updateTaskActivity: UpdateTaskActivity
    ) {}

    async execute(input: UpdateTaskInput) {
        const task = await this.getTaskByIdActivity.execute({
            taskId: input.taskId,
            email: input.email,
        });

        if (!task) {
            return null;
        }

        return this.updateTaskActivity.execute(input);
    }
}