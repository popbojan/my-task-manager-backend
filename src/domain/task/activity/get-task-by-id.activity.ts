import type { TaskPort } from "../port/task.port.js";
import type { GetTaskByIdInput } from "../model/get-task-by-id-input.js";

export class GetTaskByIdActivity {
    constructor(private readonly taskPort: TaskPort) {}

    async execute(input: GetTaskByIdInput) {
        return this.taskPort.findById(input);
    }
}