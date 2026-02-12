import type { FastifyPluginAsync } from "fastify";
import type { components } from "./types/api";
import type { AuthService } from "../../../domain/auth/auth.service";

type OTPRequest = components["schemas"]["OTPRequest"];

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
};
