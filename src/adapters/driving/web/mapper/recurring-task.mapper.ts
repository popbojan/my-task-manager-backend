import type { components } from "../types/api.js";
import type { CreateRecurringTaskInput } from "../../../../domain/recurring-task/model/create-recurring-task-input";
import type {
    RecurringTask,
    RecurringTaskProgress,
} from "../../../../domain/recurring-task/model/recurring-task";
import type { UpdateRecurringTaskInput } from "../../../../domain/recurring-task/model/update-recurring-task-input";
import type { GetRecurringTaskByIdInput } from "../../../../domain/recurring-task/model/get-recurring-task-by-id-input";
import type { DeleteRecurringTaskInput } from "../../../../domain/recurring-task/model/delete-recurring-task-input";

type CreateRecurringTaskRequest = components["schemas"]["CreateRecurringTaskRequest"];
type RecurringTaskResponse = components["schemas"]["RecurringTask"];
type UpdateRecurringTaskRequest = components["schemas"]["UpdateRecurringTaskRequest"];
type RecurringTaskProgressResponse = components["schemas"]["RecurringTaskProgress"];

export function mapCreateRecurringTaskRequestToInput(
    email: string,
    request: CreateRecurringTaskRequest,
): Omit<CreateRecurringTaskInput, "nextResetAt"> {
    return {
        email,
        title: request.title,
        description: request.description ?? null,
        frequency: request.frequency,
    };
}

export function mapUpdateRecurringTaskRequestToInput(
    recurringTaskId: string,
    email: string,
    request: UpdateRecurringTaskRequest,
): UpdateRecurringTaskInput {
    return {
        recurringTaskId,
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
        ...(request.frequency !== undefined && {
            frequency: request.frequency,
        }),
    };
}

export function mapRecurringTaskToResponse(recurringTask: RecurringTask): RecurringTaskResponse {
    return {
        id: recurringTask.id,
        title: recurringTask.title,
        description: recurringTask.description,
        status: recurringTask.status,
        frequency: recurringTask.frequency,
        streakCount: recurringTask.streakCount,
        lastCompletedAt: recurringTask.lastCompletedAt?.toISOString() ?? null,
        lastResetAt: recurringTask.lastResetAt?.toISOString() ?? null,
        nextResetAt: recurringTask.nextResetAt.toISOString(),
        email: recurringTask.email,
        createdAt: recurringTask.createdAt.toISOString(),
        updatedAt: recurringTask.updatedAt.toISOString(),
    };
}

export function mapRecurringTaskProgressToResponse(
    progress: RecurringTaskProgress,
): RecurringTaskProgressResponse {
    return {
        id: progress.id,
        email: progress.email,
        allTasksStreak: progress.allTasksStreak,
        lastCheckedAt: progress.lastCheckedAt?.toISOString() ?? null,
    };
}

export function mapGetRecurringTaskByIdRequestToInput(
    recurringTaskId: string,
    email: string,
): GetRecurringTaskByIdInput {
    return {
        recurringTaskId,
        email,
    };
}

export function mapDeleteRecurringTaskRequestToInput(
    recurringTaskId: string,
    email: string,
): DeleteRecurringTaskInput {
    return {
        recurringTaskId,
        email,
    };
}
