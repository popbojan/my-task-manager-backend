import { FastifyInstance } from 'fastify';
import type {components} from "./types/api";

type OTPRequest = components['schemas']['OTPRequest'];

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: OTPRequest }>(
        '/auth/request-otp',
        async (request, reply) => {
            const { email } = request.body;
            return { message: `OTP sent to ${email}` };
        }
    );
}