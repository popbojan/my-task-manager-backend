import type { FastifyPluginAsync } from "fastify";
import type {components, operations} from "./types/api";
import type { RequestOtpUseCase } from "../../../domain/auth/request-otp.use-case";
import type {LoginWithOtpUseCase} from "../../../domain/auth/login-with-otp.use-case";

type OTPRequest = components["schemas"]["OTPRequest"];

export const authRoutes: FastifyPluginAsync<{
    requestOtpUseCase: RequestOtpUseCase;
    loginWithOtpUseCase: LoginWithOtpUseCase;

}> = async (fastify, opts) => {
    const { requestOtpUseCase } = opts;
    const { loginWithOtpUseCase } = opts;

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

            const token = await loginWithOtpUseCase.execute(email, otp);

            if (!token) {
                return reply.code(401).send({
                    statusCode: 401,
                    error: "Unauthorized",
                    message: "Invalid or expired OTP",
                });
            }

            return reply.code(200).send({ accessToken: token });
        }
    );
};
