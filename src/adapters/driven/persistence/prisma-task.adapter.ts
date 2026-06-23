import type { PrismaClient } from "@prisma/client";
import type { TaskPort } from "../../../domain/task/port/task.port.js";
import type { CreateTaskInput } from "../../../domain/task/model/create-task-input";
import type { UpdateTaskInput } from "../../../domain/task/model/udate-task-input";
import { mapTask } from "../mapper/task.mapper";

export class PrismaTaskAdapter implements TaskPort {
    constructor(private readonly prisma: PrismaClient) {}

    async findByUserId(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return [];
        }

        const tasks = await this.prisma.task.findMany({
            where: { userId: user.id },
            include: { user: true },
            orderBy: { createdAt: "desc" },
        });

        return tasks.map((task) => mapTask(task));
    }

    async create(input: CreateTaskInput) {

        const task = await this.prisma.task.create({
            data: {
                userId: input.userId,
                title: input.title,
                description: input.description,
                status: input.status,
                priority: input.priority,
                deadline: input.deadline,
            },
            include: { user: true },
        });

        return mapTask(task);
    }

    async update(input: UpdateTaskInput) {
        const { taskId, userId: _discardedUserId, ...data } = input;

        const task = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data,
            include: { user: true },
        });

        return mapTask(task);
    }

    async findById(taskId: string) {
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
            include: { user: true },
        });

        if (!task) {
            return null;
        }

        return mapTask(task);
    }

    async delete(taskId: string): Promise<void> {
        await this.prisma.task.delete({
            where: {
                id: taskId,
            },
        });
    }
}
