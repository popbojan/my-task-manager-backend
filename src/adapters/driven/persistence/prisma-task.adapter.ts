import type { PrismaClient } from "@prisma/client";
import type { TaskPort } from "../../../domain/task/port/task.port.js";
import type { CreateTaskInput } from "../../../domain/task/model/create-task-input";
import type { UpdateTaskInput } from "../../../domain/task/model/udate-task-input";
import type { Task } from "../../../domain/task/model/task";

type TaskRecord = {
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

export class PrismaTaskAdapter implements TaskPort {
    constructor(private readonly prisma: PrismaClient) {}

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return [];
        }

        const tasks = await this.prisma.task.findMany({
            where: { userId: user.id },
            include: { user: true },
            orderBy: { createdAt: "desc" },
        });

        return tasks.map((task) => this.mapTask(task));
    }

    async create(input: CreateTaskInput) {
        const user = await this.prisma.user.upsert({
            where: { email: input.email },
            create: { email: input.email },
            update: {},
        });

        const task = await this.prisma.task.create({
            data: {
                userId: user.id,
                title: input.title,
                description: input.description,
                status: input.status,
                priority: input.priority,
                deadline: input.deadline,
            },
            include: { user: true },
        });

        return this.mapTask(task);
    }

    async update(input: UpdateTaskInput) {
        const { taskId, email: _discardedOwnerEmail, ...data } = input;

        const task = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data,
            include: { user: true },
        });

        return this.mapTask(task);
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

        return this.mapTask(task);
    }

    async delete(taskId: string): Promise<void> {
        await this.prisma.task.delete({
            where: {
                id: taskId,
            },
        });
    }

    private mapTask(task: TaskRecord): Task {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline,
            email: task.user.email,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };
    }
}
