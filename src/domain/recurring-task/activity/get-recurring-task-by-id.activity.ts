import type { RecurringTaskPort } from "../port/recurring-task.port";
import type { GetRecurringTaskByIdInput } from "../model/get-recurring-task-by-id-input";
import { ForbiddenRecurringTaskAccessException } from "../exception/forbidden-recurring-task-access.exception";

export class GetRecurringTaskByIdActivity {
    constructor(private readonly recurringTaskPort: RecurringTaskPort) {}

    async execute(input: GetRecurringTaskByIdInput) {
        const recurringTask = await this.recurringTaskPort.findById(input.recurringTaskId);

        if (!recurringTask) {
            return null;
        }

        if (recurringTask.email !== input.email) {
            throw new ForbiddenRecurringTaskAccessException();
        }

        return recurringTask;
    }
}
