import type { CreateRecurringTaskInput } from "../model/create-recurring-task-input";
import type { RecurringTask, RecurringTaskProgress } from "../model/recurring-task";
import type { UpdateRecurringTaskInput } from "../model/update-recurring-task-input";

export interface RecurringTaskPort {
    findByEmail(email: string): Promise<RecurringTask[]>;
    findById(recurringTaskId: string): Promise<RecurringTask | null>;
    create(input: CreateRecurringTaskInput): Promise<RecurringTask>;
    update(input: UpdateRecurringTaskInput): Promise<RecurringTask | null>;
    delete(recurringTaskId: string): Promise<void>;
    findProgressByEmail(email: string): Promise<RecurringTaskProgress | null>;
    getOrCreateProgress(email: string): Promise<RecurringTaskProgress>;
}
