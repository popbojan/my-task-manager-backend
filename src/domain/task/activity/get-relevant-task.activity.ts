import type { TaskPort } from "../port/task.port";

export class GetRelevantTaskActivity {
  constructor(private taskPort: TaskPort) {}

  async execute(email: string) {
    return this.taskPort.findByEmail(email);
  }
}