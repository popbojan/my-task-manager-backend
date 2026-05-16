import type { FastifyPluginAsync } from "fastify";
import type { components, operations } from "./types/api";
import type { RequestOtpUseCase } from "../../../domain/auth/request-otp.use-case";
import type { LoginWithOtpUseCase } from "../../../domain/auth/login-with-otp.use-case";
import type { AuthRefreshUseCase } from "../../../domain/auth/auth-refresh.use-case";
import type { LogoutUseCase } from "../../../domain/auth/logout.use-case";
import { toFastifySchema } from "./openapi/openapi-schema.mapper.js";

type OTPRequest = components["schemas"]["OTPRequest"];

export const authRoutes: FastifyPluginAsync<{
    requestOtpUseCase: RequestOtpUseCase;
    loginWithOtpUseCase: LoginWithOtpUseCase;
    authRefreshUseCase: AuthRefreshUseCase;
    logoutUseCase: LogoutUseCase;
    openApiSpec: unknown;
}> = async (fastify, opts) => {
    const {
        requestOtpUseCase,
        loginWithOtpUseCase,
        authRefreshUseCase,
        logoutUseCase,
        openApiSpec,
    } = opts;

    const spec = openApiSpec as {
        paths: Record<
            string,
            {
                post?: {
                    requestBody?: {
                        content: {
                            "application/json": { schema: unknown };
                        };
                    };
                };
            }
        >;
    };

    const requestOtpJson =
        spec.paths["/auth/request-otp"]?.post?.requestBody?.content?.[
            "application/json"
        ];
    if (requestOtpJson?.schema === undefined) {
        throw new Error("OpenAPI spec missing POST /auth/request-otp JSON body schema");
    }

    const loginWithOtpJson =
        spec.paths["/auth/login-with-otp"]?.post?.requestBody?.content?.[
            "application/json"
        ];
    if (loginWithOtpJson?.schema === undefined) {
        throw new Error(
            "OpenAPI spec missing POST /auth/login-with-otp JSON body schema",
        );
    }

    const requestOtpBodySchema = toFastifySchema(requestOtpJson.schema);

    const loginWithOtpBodySchema = toFastifySchema(loginWithOtpJson.schema);

    fastify.post<{ Body: OTPRequest }>(
        "/auth/request-otp",
        {
            schema: {
                body: requestOtpBodySchema,
            },
        },
        async (request) => {
            const { email } = request.body;

            await requestOtpUseCase.execute(email);

            return { message: "OTP sent to your email" };
        },
    );

    type LoginWithOtp = operations["loginWithOtp"];

    fastify.post<{
        Body: LoginWithOtp["requestBody"]["content"]["application/json"];
        Reply:
            | LoginWithOtp["responses"][200]["content"]["application/json"]
            | LoginWithOtp["responses"][401]["content"]["application/json"];
    }>(
        "/auth/login-with-otp",
        {
            schema: {
                body: loginWithOtpBodySchema,
            },
        },
        async (request, reply) => {
            const { email, otp } = request.body;

            const tokens = await loginWithOtpUseCase.execute(email, otp);

            if (!tokens) {
                return reply.code(401).send({
                    statusCode: 401,
                    error: "Unauthorized",
                    message: "Invalid or expired OTP",
                });
            }

            reply.setCookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/auth",
                maxAge: tokens.refreshTtlSeconds,
            });

            return reply.code(200).send({
                accessToken: tokens.accessToken,
            });
        },
    );

    type RefreshOp = operations["refreshAccessToken"];

    fastify.post<{
        Reply:
            | RefreshOp["responses"][200]["content"]["application/json"]
            | RefreshOp["responses"][401]["content"]["application/json"];
    }>("/auth/refresh", async (request, reply) => {
        const refreshToken = request.cookies.refreshToken;

        if (!refreshToken) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Missing refresh token",
            });
        }

        try {
            const result = await authRefreshUseCase.execute(refreshToken);

            if (!result) {
                return reply.code(401).send({
                    statusCode: 401,
                    error: "Unauthorized",
                    message: "Invalid or expired refresh token",
                });
            }

            reply.setCookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/auth",
                maxAge: result.refreshTtlSeconds,
            });

            return reply.code(200).send({ accessToken: result.accessToken });
        } catch (_error) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Invalid or expired refresh token",
            });
        }
    });

    type LogoutOp = operations["logout"];

    type LogoutReply =
        | void
        | LogoutOp["responses"][401]["content"]["application/json"];

    fastify.post<{ Reply: LogoutReply }>("/auth/logout", async (request, reply) => {
        const refreshToken = request.cookies.refreshToken;

        if (!refreshToken) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Missing refresh token",
            });
        }

        try {
            await logoutUseCase.execute(refreshToken);

            reply.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/auth",
            });

            return reply.code(204).send();
        } catch {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Invalid or expired refresh token",
            });
        }
    });
};
