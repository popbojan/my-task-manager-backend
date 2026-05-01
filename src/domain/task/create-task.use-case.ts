import type {components} from "../../adapters/driving/web/types/api.js";
import type {CreateTaskActivity} from "./activity/create-task.activity.js";

type CreateTaskRequest = components["schemas"]["CreateTaskRequest"];

export class CreateTaskUseCase {
    constructor(private readonly createTaskActivity: CreateTaskActivity) {
    }

    async execute(email: string, request: CreateTaskRequest) {
        return this.createTaskActivity.execute({
            email,
            title: request.title,
            description: request.description ?? null,
            status: request.status ?? "todo",
            priority: request.priority ?? "none",
            deadline: request.deadline ? new Date(request.deadline) : null,
        });
    }
}