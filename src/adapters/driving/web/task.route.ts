import type {FastifyPluginAsync} from "fastify";
import type {operations} from "./types/api";
import type {GetTaskUseCase} from "../../../domain/task/get-task.use-case";
import type {GetAuthenticatedEmailUseCase} from "../../../domain/auth/get-authenticated-email.use-case";
import type {CreateTaskUseCase} from "../../../domain/task/create-task.use-case";
import {mapCreateTaskRequestToInput, mapTaskToResponse, mapUpdateTaskRequestToInput} from "./mapper/task.mapper";
import { buildAuthHook } from "./auth/auth.hook.js";
import type {UpdateTaskUseCase} from "../../../domain/task/update-task.use-case";

type GetTasksOp = operations["getTasks"];
type CreateTaskOp = operations["createTask"];

export const taskRoutes: FastifyPluginAsync<{
    getTaskUseCase: GetTaskUseCase;
    getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
    createTaskUseCase: CreateTaskUseCase;
    updateTaskUseCase: UpdateTaskUseCase;
}> = async (fastify, opts) => {
    const {getTaskUseCase, getAuthenticatedEmailUseCase, createTaskUseCase, updateTaskUseCase} = opts;
    const authHook = buildAuthHook(getAuthenticatedEmailUseCase);
    fastify.addHook("preHandler", authHook);

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
    }>("/tasks", async (request, reply) => {
        const email = request.user.email;

        const input = mapCreateTaskRequestToInput(email, request.body);
        const task = await createTaskUseCase.execute(input);

        return reply.code(201).send(mapTaskToResponse(task));
    });

    type UpdateTaskOp = operations["updateTask"];

    type UpdateTaskReply =
        | UpdateTaskOp["responses"][200]["content"]["application/json"]
        | UpdateTaskOp["responses"][404]["content"]["application/json"];

    fastify.patch<{
        Params: UpdateTaskOp["parameters"]["path"];
        Body: UpdateTaskOp["requestBody"]["content"]["application/json"];
        Reply: UpdateTaskReply;
    }>("/tasks/:taskId", async (request, reply) => {
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

}