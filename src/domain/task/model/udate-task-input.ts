import type { TaskPriority, TaskStatus } from "./task";

export type UpdateTaskInput = {
    taskId: string;
    userId: string;
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: Date | null;
};
