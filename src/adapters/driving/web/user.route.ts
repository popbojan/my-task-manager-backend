import type { FastifyPluginAsync } from "fastify";
import type { operations } from "./types/api.js";
import type { GetCurrentUserUseCase } from "../../../domain/user/get-current-user.use-case.js";
import type { UpdateUserPreferencesUseCase } from "../../../domain/user/update-user-preferences.use-case.js";
import type { GetAuthenticatedEmailUseCase } from "../../../domain/auth/get-authenticated-email.use-case.js";
import { buildAuthHook } from "./auth/auth.hook.js";
import { toFastifySchema } from "./openapi/openapi-schema.mapper.js";
import type { OpenApiPathsDocument } from "./openapi/openapi-paths-document.types.js";
import { mapUserToResponse } from "./mapper/user.mapper.js";

type GetCurrentUserOp = operations["getCurrentUser"];
type UpdateUserPreferencesOp = operations["updateUserPreferences"];

export const userRoutes: FastifyPluginAsync<{
    getCurrentUserUseCase: GetCurrentUserUseCase;
    updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;
    getAuthenticatedEmailUseCase: GetAuthenticatedEmailUseCase;
    openApiSpec: OpenApiPathsDocument;
}> = async (fastify, opts) => {
    const {
        getCurrentUserUseCase,
        updateUserPreferencesUseCase,
        getAuthenticatedEmailUseCase,
        openApiSpec,
    } = opts;

    const authHook = buildAuthHook(getAuthenticatedEmailUseCase);
    fastify.addHook("preHandler", authHook);

    const updateUserPreferencesJson =
        openApiSpec.paths["/users/me/preferences"]?.patch?.requestBody?.content?.[
            "application/json"
        ];
    if (updateUserPreferencesJson?.schema === undefined) {
        throw new Error("OpenAPI spec missing PATCH /users/me/preferences JSON body schema");
    }

    const updateUserPreferencesBodySchema = toFastifySchema(updateUserPreferencesJson.schema);

    fastify.get<{
        Reply:
            | GetCurrentUserOp["responses"][200]["content"]["application/json"]
            | GetCurrentUserOp["responses"][401]["content"]["application/json"];
    }>("/users/me", async (request, reply) => {
        const user = await getCurrentUserUseCase.execute(request.user.email);

        if (!user) {
            return reply.code(404).send({
                statusCode: 404,
                error: "Not Found",
                message: "User not found",
            });
        }

        return reply.code(200).send(mapUserToResponse(user));
    });

    fastify.patch<{
        Body: UpdateUserPreferencesOp["requestBody"]["content"]["application/json"];
        Reply:
            | UpdateUserPreferencesOp["responses"][200]["content"]["application/json"]
            | UpdateUserPreferencesOp["responses"][400]["content"]["application/json"]
            | UpdateUserPreferencesOp["responses"][401]["content"]["application/json"];
    }>(
        "/users/me/preferences",
        {
            schema: {
                body: updateUserPreferencesBodySchema,
            },
        },
        async (request, reply) => {
            const result = await updateUserPreferencesUseCase.execute(
                request.user.email,
                request.body.language,
            );

            if (!result) {
                return reply.code(404).send({
                    statusCode: 404,
                    error: "Not Found",
                    message: "User not found",
                });
            }

            return reply.code(200).send(result);
        },
    );
};
