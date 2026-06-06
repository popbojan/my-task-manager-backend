import type { CreateRecurringTaskInput } from "../model/create-recurring-task-input";
import type { RecurringTask, RecurringTaskProgress } from "../model/recurring-task";
import type { UpdateRecurringTaskInput } from "../model/update-recurring-task-input";
import type { UpdateRecurringTaskProgressInput } from "../model/update-recurring-task-progress-input";
import type { ResetDueRecurringTasksResult } from "../model/reset-due-recurring-tasks-result";

export interface RecurringTaskPort {
    findByEmail(email: string): Promise<RecurringTask[]>;
    findDailyByEmail(email: string): Promise<RecurringTask[]>;
    findDueForReset(asOf: Date): Promise<RecurringTask[]>;
    findById(recurringTaskId: string): Promise<RecurringTask | null>;
    create(input: CreateRecurringTaskInput): Promise<RecurringTask>;
    update(input: UpdateRecurringTaskInput): Promise<RecurringTask>;
    delete(recurringTaskId: string): Promise<void>;
    findProgressByEmail(email: string): Promise<RecurringTaskProgress | null>;
    getOrCreateProgress(email: string): Promise<RecurringTaskProgress>;
    updateProgress(email: string, input: UpdateRecurringTaskProgressInput,): Promise<RecurringTaskProgress>;
    resetDueRecurringTasks(input: { taskUpdates: UpdateRecurringTaskInput[]; progressUpdates: UpdateRecurringTaskProgressInput[]; }): Promise<ResetDueRecurringTasksResult>;
}
