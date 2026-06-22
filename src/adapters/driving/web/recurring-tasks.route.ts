import type { FastifyPluginAsync } from "fastify";
import type { operations } from "./types/api";
import type { GetRecurringTasksUseCase } from "../../../domain/recurring-task/get-recurring-tasks.use-case";
import type { GetRecurringTaskByIdUseCase } from "../../../domain/recurring-task/get-recurring-task-by-id.use-case";
import type { GetAuthenticatedEmailUseCase } from "../../../domain/auth/get-authenticated-email.use-case";
import type { CreateRecurringTaskUseCase } from "../../../domain/recurring-task/create-recurring-task.use-case";
import type { DeleteRecurringTaskUseCase } from "../../../domain/recurring-task/delete-recurring-task.use-case";
import type { UpdateRecurringTaskUseCase } from "../../../domain/recurring-task/update-recurring-task.use-case";
import type { GetRecurringTaskProgressUseCase } from "../../../domain/recurring-task/get-recurring-task-progress.use-case";
import {
    mapCreateRecurringTaskRequestToInput,
    mapDeleteRecurringTaskRequestToInput,
    mapGetRecurringTaskByIdRequestToInput,
    mapRecurringTaskProgressToResponse,
    mapRecurringTaskToResponse,
    mapUpdateRecurringTaskRequestToInput,
} from "./mapper/recurring-task.mapper";
import { buildAuthHook } from "./auth/auth.hook.js";
import { toFastifySchema } from "./openapi/openapi-schema.mapper";
import { ForbiddenRecurringTaskAccessException } from "../../../domain/recurring-task/exception/forbidden-recurring-task-access.exception";
import type { OpenApiPathsDocument } from "./openapi/openapi-paths-document.types";

type GetRecurringTasksOp = operations["getRecurringTasks"];
type GetRecurringTaskOp = operations["getRecurringTask"];
type CreateRecurringTaskOp = operations["createRecurringTask"];
type UpdateRecurringTaskOp = operations["updateRecurringTask"];
type DeleteRecurringTaskOp = operations["deleteRecurringTask"];
type GetRecurringTaskProgressOp = operations["getRecurringTaskProgress"];

export const recurringTaskRoutes: FastifyPluginAsync<{
    getRecurringTasksUseCase: GetRecurringTasksUseCase;
    getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
    createRecurringTaskUseCase: CreateRecurringTaskUseCase;
    updateRecurringTaskUseCase: UpdateRecurringTaskUseCase;
    getRecurringTaskByIdUseCase: GetRecurringTaskByIdUseCase;
    deleteRecurringTaskUseCase: DeleteRecurringTaskUseCase;
    getRecurringTaskProgressUseCase: GetRecurringTaskProgressUseCase;
    openApiSpec: OpenApiPathsDocument;
}> = async (fastify, opts) => {
    const {
        getRecurringTasksUseCase,
        getAuthenticatedEmailUseCase,
        createRecurringTaskUseCase,
        updateRecurringTaskUseCase,
        getRecurringTaskByIdUseCase,
        deleteRecurringTaskUseCase,
        getRecurringTaskProgressUseCase,
        openApiSpec,
    } = opts;

    const authHook = buildAuthHook(getAuthenticatedEmailUseCase);
    fastify.addHook("preHandler", authHook);

    fastify.setErrorHandler((error, request, reply) => {
        if (error instanceof ForbiddenRecurringTaskAccessException) {
            return reply.code(403).send({
                statusCode: 403,
                error: "Forbidden",
                message: error.message,
            });
        }

        request.log.error(error);
        return reply.send(error);
    });

    const recurringTasksPostJson =
        openApiSpec.paths["/recurring-tasks"]?.post?.requestBody?.content?.["application/json"];
    if (recurringTasksPostJson?.schema === undefined) {
        throw new Error("OpenAPI spec missing POST /recurring-tasks JSON body schema");
    }

    const patchRecurringTaskJson =
        openApiSpec.paths["/recurring-tasks/{recurringTaskId}"]?.patch?.requestBody?.content?.[
            "application/json"
        ];
    if (patchRecurringTaskJson?.schema === undefined) {
        throw new Error(
            "OpenAPI spec missing PATCH /recurring-tasks/{recurringTaskId} JSON body schema",
        );
    }

    const createRecurringTaskBodySchema = toFastifySchema(recurringTasksPostJson.schema);
    const updateRecurringTaskBodySchema = toFastifySchema(patchRecurringTaskJson.schema);

    fastify.get<{
        Reply:
            | GetRecurringTasksOp["responses"][200]["content"]["application/json"]
            | GetRecurringTasksOp["responses"][401]["content"]["application/json"];
    }>("/recurring-tasks", async (request, reply) => {

        const user = request.user;

        const recurringTasks = await getRecurringTasksUseCase.execute(user.id);

        return reply.code(200).send(recurringTasks.map(mapRecurringTaskToResponse));
    });

    fastify.post<{
        Body: CreateRecurringTaskOp["requestBody"]["content"]["application/json"];
        Reply:
            | CreateRecurringTaskOp["responses"][201]["content"]["application/json"]
            | CreateRecurringTaskOp["responses"][400]["content"]["application/json"]
            | CreateRecurringTaskOp["responses"][401]["content"]["application/json"];
    }>(
        "/recurring-tasks",
        {
            schema: {
                body: createRecurringTaskBodySchema,
            },
        },
        async (request, reply) => {
            const userId = request.user.id;

            const input = mapCreateRecurringTaskRequestToInput(userId, request.body);
            const recurringTask = await createRecurringTaskUseCase.execute(input);

            return reply.code(201).send(mapRecurringTaskToResponse(recurringTask));
        },
    );

    type GetRecurringTaskReply =
        | GetRecurringTaskOp["responses"][200]["content"]["application/json"]
        | GetRecurringTaskOp["responses"][403]["content"]["application/json"]
        | GetRecurringTaskOp["responses"][404]["content"]["application/json"];

    fastify.get<{
        Params: GetRecurringTaskOp["parameters"]["path"];
        Reply: GetRecurringTaskReply;
    }>("/recurring-tasks/:recurringTaskId", async (request, reply) => {
        const userId = request.user.id;

        const input = mapGetRecurringTaskByIdRequestToInput(
            request.params.recurringTaskId,
            userId,
        );

        const recurringTask = await getRecurringTaskByIdUseCase.execute(input);

        if (!recurringTask) {
            return reply.code(404).send({
                statusCode: 404,
                error: "Not Found",
                message: "Recurring task not found",
            });
        }

        return reply.code(200).send(mapRecurringTaskToResponse(recurringTask));
    });

    type UpdateRecurringTaskReply =
        | UpdateRecurringTaskOp["responses"][200]["content"]["application/json"]
        | UpdateRecurringTaskOp["responses"][403]["content"]["application/json"]
        | UpdateRecurringTaskOp["responses"][404]["content"]["application/json"];

    fastify.patch<{
        Params: UpdateRecurringTaskOp["parameters"]["path"];
        Body: UpdateRecurringTaskOp["requestBody"]["content"]["application/json"];
        Reply: UpdateRecurringTaskReply;
    }>(
        "/recurring-tasks/:recurringTaskId",
        {
            schema: {
                body: updateRecurringTaskBodySchema,
            },
        },
        async (request, reply) => {
            const userId = request.user.id;

            const input = mapUpdateRecurringTaskRequestToInput(
                request.params.recurringTaskId,
                userId,
                request.body,
            );

            const recurringTask = await updateRecurringTaskUseCase.execute(input);

            if (!recurringTask) {
                return reply.code(404).send({
                    statusCode: 404,
                    error: "Not Found",
                    message: "Recurring task not found",
                });
            }

            return reply.code(200).send(mapRecurringTaskToResponse(recurringTask));
        },
    );

    type DeleteRecurringTaskReply =
        | void
        | DeleteRecurringTaskOp["responses"][403]["content"]["application/json"];

    fastify.delete<{
        Params: DeleteRecurringTaskOp["parameters"]["path"];
        Reply: DeleteRecurringTaskReply;
    }>("/recurring-tasks/:recurringTaskId", async (request, reply) => {
        const userId = request.user.id;

        const input = mapDeleteRecurringTaskRequestToInput(
            request.params.recurringTaskId,
            userId,
        );

        await deleteRecurringTaskUseCase.execute(input);

        return reply.code(204).send();
    });

    fastify.get<{
        Reply:
            | GetRecurringTaskProgressOp["responses"][200]["content"]["application/json"]
            | GetRecurringTaskProgressOp["responses"][401]["content"]["application/json"];
    }>("/recurring-task-progress", async (request, reply) => {
        const userId = request.user.id;

        const progress = await getRecurringTaskProgressUseCase.execute(userId);

        return reply.code(200).send(mapRecurringTaskProgressToResponse(progress));
    });
};
