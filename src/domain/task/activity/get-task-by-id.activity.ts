import type { TaskPort } from "../port/task.port.js";
import type { GetTaskByIdInput } from "../model/get-task-by-id-input.js";
import { ForbiddenTaskAccessException } from "../exception/forbidden-task-access.exception";

export class GetTaskByIdActivity {
    constructor(private readonly taskPort: TaskPort) {}

    async execute(input: GetTaskByIdInput) {
        const task = await this.taskPort.findById(input.taskId);

        if (!task) {
            return null;
        }

        if (task.email !== input.email) {
            throw new ForbiddenTaskAccessException();
        }

        return task;
    }
}
