import type { GetRelevantTaskActivity } from "./activity/get-relevant-task.activity.js";

export class GetTaskUseCase {
  constructor(
    private readonly getRelevantTaskActivity: GetRelevantTaskActivity
  ) {}

  async execute(email: string) {
    return this.getRelevantTaskActivity.execute(email);
  }
}