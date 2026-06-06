import type { PrismaClient } from "@prisma/client";
import type { RecurringTaskPort } from "../../../domain/recurring-task/port/recurring-task.port";
import type { CreateRecurringTaskInput } from "../../../domain/recurring-task/model/create-recurring-task-input";
import type { UpdateRecurringTaskInput } from "../../../domain/recurring-task/model/update-recurring-task-input";

export class PrismaRecurringTaskAdapter implements RecurringTaskPort {
    constructor(private readonly prisma: PrismaClient) {}

    async findByEmail(email: string) {
        return this.prisma.recurringTask.findMany({
            where: { email },
            orderBy: { createdAt: "desc" },
        });
    }

    async findById(recurringTaskId: string) {
        return this.prisma.recurringTask.findUnique({
            where: { id: recurringTaskId },
        });
    }

    async create(input: CreateRecurringTaskInput) {
        return this.prisma.recurringTask.create({
            data: input,
        });
    }

    async update(input: UpdateRecurringTaskInput) {
        const { recurringTaskId, email: _discardedOwnerEmail, ...data } = input;

        return this.prisma.recurringTask.update({
            where: { id: recurringTaskId },
            data,
        });
    }

    async delete(recurringTaskId: string): Promise<void> {
        await this.prisma.recurringTask.delete({
            where: { id: recurringTaskId },
        });
    }

    async findProgressByEmail(email: string) {
        return this.prisma.recurringTaskProgress.findUnique({
            where: { email },
        });
    }

    async getOrCreateProgress(email: string) {
        const existing = await this.findProgressByEmail(email);

        if (existing) {
            return existing;
        }

        return this.prisma.recurringTaskProgress.create({
            data: { email },
        });
    }
}
