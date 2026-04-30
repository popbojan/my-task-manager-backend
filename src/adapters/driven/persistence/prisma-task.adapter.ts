import type { PrismaClient } from "@prisma/client";
import type { TaskPort } from "../../../domain/task/port/task.port";

export class PrismaTaskAdapter implements TaskPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.task.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  }
}