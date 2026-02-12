import type { FastifyPluginAsync } from "fastify";
import type { components } from "./types/api";
import type { AuthService } from "../../../domain/auth/auth.service";

type OTPRequest = components["schemas"]["OTPRequest"];
type OTPVerifyRequest = components["schemas"]["OTPVerifyRequest"];
type AuthTokenResponse = components["schemas"]["AuthTokenResponse"];

export const authRoutes: FastifyPluginAsync<{
    authService: AuthService;
}> = async (fastify, opts) => {
    const { authService } = opts;

    fastify.post<{ Body: OTPRequest }>(
        "/auth/request-otp",
        async (request) => {
            const { email } = request.body;

            await authService.requestOtp(email);

            return { message: "OTP sent to your email" };
        }
    );

    fastify.post<{ Body: OTPVerifyRequest; Reply: AuthTokenResponse }>(
        "/auth/verify-otp",
        async (request, reply) => {
            const { email, otp } = request.body;

            const valid = authService.verifyOtp(email, otp);
            if (!valid) {
                return reply.code(401).send({
                    statusCode: 401,
                    error: "Unauthorized",
                    message: "Invalid or expired OTP",
                });
            }

            const accessToken = authService.generateAccessToken(email);

            return { accessToken };
        }
    );
};
