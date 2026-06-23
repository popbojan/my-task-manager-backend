import type {TaskEntity} from "../entity/task.entity";
import type {Task} from "../../../domain/task/model/task";

export function mapTask(task: TaskEntity): Task {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
}