import type {Task} from "../../../domain/task/model/task";

export type TaskEntity = {
    id: string;
    title: string;
    description: string | null;
    status: Task["status"];
    priority: Task["priority"];
    deadline: Date | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        email: string;
    };
};
