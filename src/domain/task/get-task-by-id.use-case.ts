import type { GetTaskByIdActivity } from "./activity/get-task-by-id.activity.js";
import type { GetTaskByIdInput } from "./model/get-task-by-id-input.js";

export class GetTaskByIdUseCase {
    constructor(private readonly getTaskByIdActivity: GetTaskByIdActivity) {}

    async execute(input: GetTaskByIdInput) {
        return this.getTaskByIdActivity.execute(input);
    }
}
