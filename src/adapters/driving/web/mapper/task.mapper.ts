import type { components } from "../types/api.js";
import type {CreateTaskInput} from "../../../../domain/task/model/create-task-input";
import type {Task} from "../../../../domain/task/model/task";
import type {UpdateTaskInput} from "../../../../domain/task/model/udate-task-input";

type CreateTaskRequest = components["schemas"]["CreateTaskRequest"];
type TaskResponse = components["schemas"]["Task"];
type UpdateTaskRequest = components["schemas"]["UpdateTaskRequest"];

export function mapCreateTaskRequestToInput(
    email: string,
    request: CreateTaskRequest
): CreateTaskInput {
    return {
        email,
        title: request.title,
        description: request.description ?? null,
        status: request.status ?? "todo",
        priority: request.priority ?? "none",
        deadline: request.deadline ? new Date(request.deadline) : null,
    };
}

export function mapUpdateTaskRequestToInput(
    taskId: string,
    email: string,
    request: UpdateTaskRequest
): UpdateTaskInput {
    return {
        taskId,
        email,
        ...(request.title !== undefined && {
            title: request.title,
        }),
        ...(request.description !== undefined && {
            description: request.description,
        }),
        ...(request.status !== undefined && {
            status: request.status,
        }),
        ...(request.priority !== undefined && {
            priority: request.priority,
        }),
        ...(request.deadline !== undefined && {
            deadline: request.deadline ? new Date(request.deadline) : null,
        }),
    };
}

export function mapTaskToResponse(task: Task): TaskResponse {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline?.toISOString() ?? null,
        email: task.email,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}