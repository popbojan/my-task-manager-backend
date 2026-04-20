import type { FastifyPluginAsync } from "fastify";
import type { components, operations } from "./types/api";
import type { RequestOtpUseCase } from "../../../domain/auth/request-otp.use-case";
import type { LoginWithOtpUseCase } from "../../../domain/auth/login-with-otp.use-case";
import type { AuthRefreshUseCase } from "../../../domain/auth/auth-refresh.use-case";
import type { LogoutUseCase } from "../../../domain/auth/logout.use-case";

type OTPRequest = components["schemas"]["OTPRequest"];

export const authRoutes: FastifyPluginAsync<{
    requestOtpUseCase: RequestOtpUseCase;
    loginWithOtpUseCase: LoginWithOtpUseCase;
    authRefreshUseCase: AuthRefreshUseCase;

}> = async (fastify, opts) => {
    const { requestOtpUseCase } = opts;
    const { loginWithOtpUseCase } = opts;
    const { authRefreshUseCase } = opts;

    fastify.post<{ Body: OTPRequest }>(
        "/auth/request-otp",
        async (request) => {
            const { email } = request.body;

            await requestOtpUseCase.execute(email);

            return { message: "OTP sent to your email" };
        }
    );

    type LoginWithOtp = operations["loginWithOtp"];

    fastify.post<{
        Body: LoginWithOtp["requestBody"]["content"]["application/json"];
        Reply:
            | LoginWithOtp["responses"][200]["content"]["application/json"]
            | LoginWithOtp["responses"][401]["content"]["application/json"];
    }>("/auth/login-with-otp", async (request, reply) => {
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
    });

    type RefreshOp = operations["refreshAccessToken"];

    fastify.post<{
        Reply:
            | RefreshOp["responses"][200]["content"]["application/json"]
            | RefreshOp["responses"][401]["content"]["application/json"];
    }>("/auth/refresh", async (request, reply) => {
        const raw = request.cookies.refreshToken;

        if (!raw) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Missing refresh token",
            });
        }

        try {
            const result = await authRefreshUseCase.execute(raw);

            reply.setCookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/auth",
                maxAge: result.refreshTtlSeconds,
            });

            return reply.code(200).send({ accessToken: result.accessToken });
        } catch (error) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Invalid or expired refresh token",
            });
        }
    });

    type LogoutOp = operations["logout"];

    fastify.post<{
        Reply:
            | LogoutOp["responses"][204]
            | LogoutOp["responses"][401]["content"]["application/json"];
    }>("/auth/logout", async (request, reply) => {
        const raw = request.cookies.refreshToken;

        if (!raw) {
            return reply.code(401).send({
                statusCode: 401,
                error: "Unauthorized",
                message: "Missing refresh token",
            });
        }

        try {
            await logoutUseCase.execute(raw);

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
