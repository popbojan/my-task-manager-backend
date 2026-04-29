import type { Task } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export class GetRelevantTaskActivity {
  constructor(private prisma: PrismaClient) {}

  async execute(email: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  }
}