import type { FastifyPluginAsync } from "fastify";
import type { operations } from "./types/api";
import type { GetTasksUseCase } from "../../../domain/task/get-tasks.use-case";
import type { GetTaskByIdUseCase } from "../../../domain/task/get-task-by-id.use-case";
import type { GetAuthenticatedEmailUseCase } from "../../../domain/auth/get-authenticated-email.use-case";
import type { CreateTaskUseCase } from "../../../domain/task/create-task.use-case";
import type { DeleteTaskUseCase } from "../../../domain/task/delete-task.use-case";
import {
    mapCreateTaskRequestToInput,
    mapGetTaskByIdRequestToInput,
    mapTaskToResponse,
    mapUpdateTaskRequestToInput,
    mapDeleteTaskRequestToInput,
} from "./mapper/task.mapper";
import { buildAuthHook } from "./auth/auth.hook.js";
import type { UpdateTaskUseCase } from "../../../domain/task/update-task.use-case";
import { toFastifySchema } from "./openapi/openapi-schema.mapper";
import { ForbiddenTaskAccessException } from "../../../domain/task/exception/forbidden-task-access.exception";
import type { OpenApiPathsDocument } from "./openapi/openapi-paths-document.types";

type GetTasksOp = operations["getTasks"];
type GetTaskByIdOp = operations["getTask"];
type CreateTaskOp = operations["createTask"];
type UpdateTaskOp = operations["updateTask"];
type DeleteTaskOp = operations["deleteTask"];

export const taskRoutes: FastifyPluginAsync<{
    getTaskUseCase: GetTasksUseCase;
    getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
    createTaskUseCase: CreateTaskUseCase;
    updateTaskUseCase: UpdateTaskUseCase;
    getTaskByIdUseCase: GetTaskByIdUseCase;
    deleteTaskUseCase: DeleteTaskUseCase;
    openApiSpec: OpenApiPathsDocument;
}> = async (fastify, opts) => {
    const {
        getTaskUseCase,
        getAuthenticatedEmailUseCase,
        createTaskUseCase,
        updateTaskUseCase,
        getTaskByIdUseCase,
        deleteTaskUseCase,
        openApiSpec,
    } = opts;

    const authHook = buildAuthHook(getAuthenticatedEmailUseCase);
    fastify.addHook("preHandler", authHook);

    fastify.setErrorHandler((error, request, reply) => {
        if (error instanceof ForbiddenTaskAccessException) {
            return reply.code(403).send({
                statusCode: 403,
                error: "Forbidden",
                message: error.message,
            });
        }

        request.log.error(error);
        return reply.send(error);
    });

    const tasksPostJson =
        openApiSpec.paths["/tasks"]?.post?.requestBody?.content?.["application/json"];
    if (tasksPostJson?.schema === undefined) {
        throw new Error("OpenAPI spec missing POST /tasks JSON body schema");
    }

    const patchTaskJson =
        openApiSpec.paths["/tasks/{taskId}"]?.patch?.requestBody?.content?.["application/json"];
    if (patchTaskJson?.schema === undefined) {
        throw new Error("OpenAPI spec missing PATCH /tasks/{taskId} JSON body schema");
    }

    const createTaskBodySchema = toFastifySchema(tasksPostJson.schema);

    const updateTaskBodySchema = toFastifySchema(patchTaskJson.schema);

    fastify.get<{
        Reply:
            | GetTasksOp["responses"][200]["content"]["application/json"]
            | GetTasksOp["responses"][401]["content"]["application/json"];
    }>("/tasks", async (request, reply) => {
        const email = request.user.email;

        const tasks = await getTaskUseCase.execute(email);

        return reply.code(200).send(tasks.map(mapTaskToResponse));
    });

    fastify.post<{
        Body: CreateTaskOp["requestBody"]["content"]["application/json"];
        Reply:
            | CreateTaskOp["responses"][201]["content"]["application/json"]
            | CreateTaskOp["responses"][400]["content"]["application/json"]
            | CreateTaskOp["responses"][401]["content"]["application/json"];
    }>(
        "/tasks",
        {
            schema: {
                body: createTaskBodySchema,
            },
        },
        async (request, reply) => {
            const email = request.user.email;

            const input = mapCreateTaskRequestToInput(email, request.body);
            const task = await createTaskUseCase.execute(input);

            return reply.code(201).send(mapTaskToResponse(task));
        },
    );

    type UpdateTaskReply =
        | UpdateTaskOp["responses"][200]["content"]["application/json"]
        | UpdateTaskOp["responses"][403]["content"]["application/json"]
        | UpdateTaskOp["responses"][404]["content"]["application/json"];

    fastify.patch<{
        Params: UpdateTaskOp["parameters"]["path"];
        Body: UpdateTaskOp["requestBody"]["content"]["application/json"];
        Reply: UpdateTaskReply;
    }>(
        "/tasks/:taskId",
        {
            schema: {
                body: updateTaskBodySchema,
            },
        },
        async (request, reply) => {
            const email = request.user.email;

            const input = mapUpdateTaskRequestToInput(request.params.taskId, email, request.body);

            const task = await updateTaskUseCase.execute(input);

            if (!task) {
                return reply.code(404).send({
                    statusCode: 404,
                    error: "Not Found",
                    message: "Task not found",
                });
            }

            return reply.code(200).send(mapTaskToResponse(task));
        },
    );

    type GetTaskByIdReply =
        | GetTaskByIdOp["responses"][200]["content"]["application/json"]
        | GetTaskByIdOp["responses"][403]["content"]["application/json"]
        | GetTaskByIdOp["responses"][404]["content"]["application/json"];

    fastify.get<{
        Params: GetTaskByIdOp["parameters"]["path"];
        Reply: GetTaskByIdReply;
    }>("/tasks/:taskId", async (request, reply) => {
        const email = request.user.email;

        const input = mapGetTaskByIdRequestToInput(request.params.taskId, email);

        const task = await getTaskByIdUseCase.execute(input);

        if (!task) {
            return reply.code(404).send({
                statusCode: 404,
                error: "Not Found",
                message: "Task not found",
            });
        }

        return reply.code(200).send(mapTaskToResponse(task));
    });

    type DeleteTaskReply = void | DeleteTaskOp["responses"][403]["content"]["application/json"];
    fastify.delete<{
        Params: DeleteTaskOp["parameters"]["path"];
        Reply: DeleteTaskReply;
    }>("/tasks/:taskId", async (request, reply) => {
        const email = request.user.email;

        const input = mapDeleteTaskRequestToInput(request.params.taskId, email);

        await deleteTaskUseCase.execute(input);

        return reply.code(204).send();
    });
};
