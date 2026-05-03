import type { UpdateTaskActivity } from "./activity/update-task.activity.js";
import type {UpdateTaskInput} from "./model/udate-task-input";

export class UpdateTaskUseCase {
    constructor(private readonly updateTaskActivity: UpdateTaskActivity) {}

    async execute(input: UpdateTaskInput) {
        return this.updateTaskActivity.execute(input);
    }
}