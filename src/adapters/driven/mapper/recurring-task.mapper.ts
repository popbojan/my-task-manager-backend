import type {RecurringTaskEntity} from "../entity/recurring-task.entity";
import type {RecurringTask} from "../../../domain/recurring-task/model/recurring-task";

export function mapRecurringTask(task: RecurringTaskEntity): RecurringTask {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        frequency: task.frequency,
        streakCount: task.streakCount,
        lastCompletedAt: task.lastCompletedAt,
        lastResetAt: task.lastResetAt,
        nextResetAt: task.nextResetAt,
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
}