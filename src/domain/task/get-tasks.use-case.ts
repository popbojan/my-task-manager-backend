import type { GetRelevantTaskActivity } from "./activity/get-relevant-task.activity.js";
import type { Task } from "./model/task.js";

export class GetTasksUseCase {
  constructor(private readonly getRelevantTaskActivity: GetRelevantTaskActivity) {}

  async execute(email: string): Promise<Task[]> {
    return this.getRelevantTaskActivity.execute(email);
  }
}