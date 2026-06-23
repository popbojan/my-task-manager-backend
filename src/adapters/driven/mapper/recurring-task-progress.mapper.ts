import type {RecurringTaskProgressEntity} from "../entity/recurring-task-progress.entity";
import type {RecurringTaskProgress} from "../../../domain/recurring-task/model/recurring-task";

export function mapRecurringTaskProgress(
    progress: RecurringTaskProgressEntity,
): RecurringTaskProgress {
    return {
        id: progress.id,
        userId: progress.userId,
        allTasksStreak: progress.allTasksStreak,
        lastCheckedAt: progress.lastCheckedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
    };
}