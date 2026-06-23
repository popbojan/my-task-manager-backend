import type { FastifyRequest, FastifyReply } from "fastify";
import type { GetAuthenticatedUserUseCase } from "../../../../domain/auth/get-authenticated-user-use.case";

export function buildAuthHook(getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase) {
    return async function authHook(request: FastifyRequest, reply: FastifyReply) {
        const token = extractBearerToken(request.headers.authorization);

        if (!token) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Missing or invalid access token",
            });
        }

        const user = await getAuthenticatedUserUseCase.execute(token);

        if (!user) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Invalid access token",
            });
        }

        request.user = {
            id: user.id,
            email: user.email,
        };
    };
}

function extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader?.startsWith("Bearer ")) {
        return null;
    }

    return authorizationHeader.slice("Bearer ".length);
}
