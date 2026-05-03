import type { TaskPort } from "../port/task.port.js";
import type {UpdateTaskInput} from "../model/udate-task-input";

export class UpdateTaskActivity {
    constructor(private readonly taskPort: TaskPort) {}

    async execute(input: UpdateTaskInput) {
        return this.taskPort.update(input);
    }
}