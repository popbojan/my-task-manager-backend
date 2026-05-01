import type {FastifyPluginAsync} from "fastify";
import type {operations} from "./types/api";
import type {GetTaskUseCase} from "../../../domain/task/get-task.use-case";
import type {GetAuthenticatedEmailUseCase} from "../../../domain/auth/get-authenticated-email.use-case";
import type {CreateTaskUseCase} from "../../../domain/task/create-task.use-case";

type GetTasksOp = operations["getTasks"];
type CreateTaskOp = operations["createTask"];

export const taskRoutes: FastifyPluginAsync<{
    getTaskUseCase: GetTaskUseCase;
    getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
    createTaskUseCase: CreateTaskUseCase;
}> = async (fastify, opts) => {
    const {getTaskUseCase, getAuthenticatedEmailUseCase, createTaskUseCase} = opts;

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

        return reply.code(200).send(tasks.map(mapTask));
    });

    fastify.post<{
        Body: CreateTaskOp["requestBody"]["content"]["application/json"];
        Reply:
            | CreateTaskOp["responses"][201]["content"]["application/json"]
            | CreateTaskOp["responses"][400]["content"]["application/json"]
            | CreateTaskOp["responses"][401]["content"]["application/json"];
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

        const task = await createTaskUseCase.execute(email, request.body);

        return reply.code(201).send(mapTask(task));
    });

};

function mapTask(task: any): GetTasksOp["responses"][200]["content"]["application/json"][number] {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline?.toISOString() ?? null,
        email: task.email,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}