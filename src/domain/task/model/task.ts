export type Task = {
    id: string;
    title: string;
    description: string | null;
    status: "todo" | "in_progress" | "review" | "done";
    priority: "none" | "important" | "urgent" | "important_urgent";
    deadline: Date | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};