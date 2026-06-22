import type { CreateRecurringTaskInput } from "../model/create-recurring-task-input";
import type { RecurringTask, RecurringTaskProgress } from "../model/recurring-task";
import type { UpdateRecurringTaskInput } from "../model/update-recurring-task-input";
import type { UpdateRecurringTaskProgressInput } from "../model/update-recurring-task-progress-input";
import type { ResetDueRecurringTasksResult } from "../model/reset-due-recurring-tasks-result";

export interface RecurringTaskPort {
    findByUserId(userId: string): Promise<RecurringTask[]>;
    findDailyByUserId(userId: string): Promise<RecurringTask[]>;
    findDueForReset(asOf: Date): Promise<RecurringTask[]>;
    findById(recurringTaskId: string): Promise<RecurringTask | null>;
    create(input: CreateRecurringTaskInput): Promise<RecurringTask>;
    update(input: UpdateRecurringTaskInput): Promise<RecurringTask>;
    delete(recurringTaskId: string): Promise<void>;
    getOrCreateProgress(userId: string): Promise<RecurringTaskProgress>;
    //updateProgress(userId: string, input: UpdateRecurringTaskProgressInput,): Promise<RecurringTaskProgress>;
    resetDueRecurringTasks(input: { taskUpdates: UpdateRecurringTaskInput[]; progressUpdates: UpdateRecurringTaskProgressInput[]; }): Promise<
        ResetDueRecurringTasksResult>;
}
