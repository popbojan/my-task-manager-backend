import type { FastifyPluginAsync } from "fastify";
import type { operations } from "./types/api";
import type { GetTaskUseCase } from "../../../domain/task/get-task.use-case";

type GetTasksOp = operations["getTasks"];

export const taskRoutes: FastifyPluginAsync<{
  getTaskUseCase: GetTaskUseCase;
}> = async (fastify, opts) => {
  const { getTaskUseCase } = opts;

  fastify.get<{
    Reply:
      | GetTasksOp["responses"][200]["content"]["application/json"]
      | GetTasksOp["responses"][401]["content"]["application/json"];
  }>("/tasks", async (request, reply) => {
    const email = "test@example.com"; // später aus JWT

    const tasks = await getTaskUseCase.execute(email);

    return reply.code(200).send(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline?.toISOString() ?? null,
        email: task.email,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }))
    );
  });
};