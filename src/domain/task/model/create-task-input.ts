export type CreateTaskInput = {
    email: string;
    title: string;
    description: string | null;
    status: "todo" | "in_progress" | "review" | "done";
    priority: "none" | "important" | "urgent" | "important_urgent";
    deadline: Date | null;
};