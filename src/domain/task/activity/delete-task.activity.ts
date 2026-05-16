import type { TaskPort } from "../port/task.port.js";

export class DeleteTaskActivity {
    constructor(private readonly taskPort: TaskPort) {}

    async execute(taskId: string) {
        return this.taskPort.delete(taskId);
    }
}
