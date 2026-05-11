import type {FastifyPluginAsync} from "fastify";
import type {operations} from "./types/api";
import type {GetTasksUseCase} from "../../../domain/task/get-tasks.use-case";
import type {GetTaskByIdUseCase} from "../../../domain/task/get-task-by-id.use-case";
import type {GetAuthenticatedEmailUseCase} from "../../../domain/auth/get-authenticated-email.use-case";
import type {CreateTaskUseCase} from "../../../domain/task/create-task.use-case";
import {
    mapCreateTaskRequestToInput,
    mapGetTaskByIdRequestToInput,
    mapTaskToResponse,
    mapUpdateTaskRequestToInput
} from "./mapper/task.mapper";
import {buildAuthHook} from "./auth/auth.hook.js";
import type {UpdateTaskUseCase} from "../../../domain/task/update-task.use-case";
import {toFastifySchema} from "./openapi/openapi-schema.mapper";

type GetTasksOp = operations["getTasks"];
type GetTaskByIdOp = operations["getTask"];
type CreateTaskOp = operations["createTask"];
type UpdateTaskOp = operations["updateTask"];

export const taskRoutes: FastifyPluginAsync<{
    getTaskUseCase: GetTasksUseCase;
    getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
    createTaskUseCase: CreateTaskUseCase;
    updateTaskUseCase: UpdateTaskUseCase;
    getTaskByIdUseCase: GetTaskByIdUseCase;
    openApiSpec: any;
}> = async (fastify, opts) => {
    const {getTaskUseCase, getAuthenticatedEmailUseCase, createTaskUseCase, updateTaskUseCase, getTaskByIdUseCase, openApiSpec} = opts;
    const authHook = buildAuthHook(getAuthenticatedEmailUseCase);
    fastify.addHook("preHandler", authHook);

    const createTaskBodySchema = toFastifySchema(
        openApiSpec.paths["/tasks"]
            .post
            .requestBody
            .content["application/json"]
            .schema
    );
    const updateTaskBodySchema =
        openApiSpec.paths["/tasks/{taskId}"]
            .patch
            .requestBody
            .content["application/json"]
            .schema;

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
    }>("/tasks",
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
    });

    type UpdateTaskReply =
        | UpdateTaskOp["responses"][200]["content"]["application/json"]
        | UpdateTaskOp["responses"][404]["content"]["application/json"];

    fastify.patch<{
        Params: UpdateTaskOp["parameters"]["path"];
        Body: UpdateTaskOp["requestBody"]["content"]["application/json"];
        Reply: UpdateTaskReply;
    }>("/tasks/:taskId", {
        schema: {
            body: updateTaskBodySchema,
        },
    }, async (request, reply) => {
        const email = request.user.email;

        const input = mapUpdateTaskRequestToInput(
            request.params.taskId,
            email,
            request.body
        );

        const task = await updateTaskUseCase.execute(input);

        if (!task) {
            return reply.code(404).send({
                statusCode: 404,
                error: "Not Found",
                message: "Task not found",
            });
        }

        return reply.code(200).send(mapTaskToResponse(task));
    });

    type GetTaskByIdReply =
        | GetTaskByIdOp["responses"][200]["content"]["application/json"]
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

}