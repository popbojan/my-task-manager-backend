import type { PrismaClient } from "@prisma/client";
import type { TaskPort } from "../../../domain/task/port/task.port.js";
import type {CreateTaskInput} from "../../../domain/task/model/create-task-input";
import type {UpdateTaskInput} from "../../../domain/task/model/udate-task-input";

export class PrismaTaskAdapter implements TaskPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.task.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateTaskInput) {
    return this.prisma.task.create({
      data: input,
    });
  }

  async update(input: UpdateTaskInput) {
    const { taskId, email, ...data } = input;

    const result = await this.prisma.task.updateMany({
      where: {
        id: taskId,
        email,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
  }
}