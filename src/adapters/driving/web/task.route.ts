import type { FastifyPluginAsync } from "fastify";
import type { operations } from "./types/api";
import type { GetTaskUseCase } from "../../../domain/task/get-task.use-case";
import type { GetAuthenticatedEmailUseCase } from "../../../domain/auth/get-authenticated-email.use-case";

type GetTasksOp = operations["getTasks"];

export const taskRoutes: FastifyPluginAsync<{
  getTaskUseCase: GetTaskUseCase;
  getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
}> = async (fastify, opts) => {
  const { getTaskUseCase, getAuthenticatedEmailUseCase } = opts;

  fastify.get<{
    Reply:
      | GetTasksOp["responses"][200]["content"]["application/json"]
      | GetTasksOp["responses"][401]["content"]["application/json"];
  }>("/tasks", async (request, reply) => {
    const email = await getAuthenticatedEmailUseCase.execute(
      request.headers.authorization
    );

    if (!email) {
      return reply.code(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Missing or invalid access token",
      });
    }

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