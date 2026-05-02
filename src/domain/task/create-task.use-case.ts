import type { CreateTaskActivity } from "./activity/create-task.activity.js";
import type {CreateTaskInput} from "./model/create-task-input";

export class CreateTaskUseCase {
    constructor(private readonly createTaskActivity: CreateTaskActivity) {}

    async execute(input: CreateTaskInput) {
        return this.createTaskActivity.execute(input);
    }
}