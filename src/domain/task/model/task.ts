export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "none" | "important" | "urgent" | "important_urgent";

export type Task = {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: Date | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};