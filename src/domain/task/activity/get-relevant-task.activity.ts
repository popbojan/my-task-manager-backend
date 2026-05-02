import type { TaskPort } from "../port/task.port.js";
import type { Task } from "../model/task.js";

export class GetRelevantTaskActivity {
  constructor(private readonly taskPort: TaskPort) {}

  async execute(email: string): Promise<Task[]> {
    return this.taskPort.findByEmail(email);
  }
}