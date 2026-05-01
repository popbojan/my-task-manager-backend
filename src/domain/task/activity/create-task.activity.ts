import type {TaskPort} from "../port/task.port.js";
import type {CreateTaskInput} from "../model/create-task-input";

export class CreateTaskActivity {
    constructor(private readonly taskPort: TaskPort) {
    }

    async execute(input: CreateTaskInput) {
        return this.taskPort.create(input);
    }
}