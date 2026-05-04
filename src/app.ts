import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

import {PrismaClient} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

import {authRoutes} from "./adapters/driving/web/auth.route.js";
import {taskRoutes} from "./adapters/driving/web/task.route.js";

import {MailerAdapter} from "./adapters/driven/mail/mailer.adapter.js";
import {JwtTokenAdapter} from "./adapters/driven/security/jwt-token.adapter.js";
import {HmacOtpAdapter} from "./adapters/driven/security/hmac-otp.adapter.js";
import {CryptoAdapter} from "./adapters/driven/security/crypto.adapter.js";
import {InMemoryStoreAdapter} from "./adapters/driven/persistence/in-memory-store.adapter.js";
import {PrismaTaskAdapter} from "./adapters/driven/persistence/prisma-task.adapter.js";

import {RequestOtpUseCase} from "./domain/auth/request-otp.use-case.js";
import {LoginWithOtpUseCase} from "./domain/auth/login-with-otp.use-case.js";
import {AuthRefreshUseCase} from "./domain/auth/auth-refresh.use-case.js";
import {LogoutUseCase} from "./domain/auth/logout.use-case.js";
import {GetAuthenticatedEmailUseCase} from "./domain/auth/get-authenticated-email.use-case.js";

import {GenerateOtpActivity} from "./domain/auth/activity/generate-otp.activity.js";
import {GenerateTokenActivity} from "./domain/auth/activity/generate-token.activity.js";
import {IssueRefreshTokenActivity} from "./domain/auth/activity/issue-refresh-token.activity.js";
import {RevokeRefreshTokenActivity} from "./domain/auth/activity/revoke-refresh-token.activity.js";
import {ValidateRefreshTokenActivity} from "./domain/auth/activity/validate-refresh-token.activity.js";
import {ValidateAccessTokenActivity} from "./domain/auth/activity/validate-access-token.activity.js";

import {GetRelevantTaskActivity} from "./domain/task/activity/get-relevant-task.activity.js";
import {CreateTaskActivity} from "./domain/task/activity/create-task.activity.js";
import {UpdateTaskActivity} from "./domain/task/activity/update-task.activity.js";

import {GetTaskUseCase} from "./domain/task/get-task.use-case.js";
import {CreateTaskUseCase} from "./domain/task/create-task.use-case.js";
import {UpdateTaskUseCase} from "./domain/task/update-task.use-case.js";

// TODO: Add Integration Tests
// TODO: Define Delete Task API
// TODO: Add Linter and prettier

export async function buildApp() {
    const fastify = Fastify({logger: true});

    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
    });

    const prisma = new PrismaClient({adapter});

    const taskPort = new PrismaTaskAdapter(prisma);
    const refreshTokenStore = new InMemoryStoreAdapter();

    const mailAdapter = new MailerAdapter({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
        from: process.env.MAIL_FROM!,
    });

    const tokenPort = new JwtTokenAdapter({
        secret: process.env.JWT_SECRET!,
        expiresIn: "60m",
        algorithm: "HS256",
    });

    const otpPort = new HmacOtpAdapter({
        secret: process.env.OTP_SECRET!,
        windowSizeSec: 240,
        digits: 6,
    });

    const cryptoPort = new CryptoAdapter();

    // -- Activities
    const generateOtpActivity = new GenerateOtpActivity(otpPort);
    const generateTokenActivity = new GenerateTokenActivity(tokenPort);
    const issueRefreshTokenActivity = new IssueRefreshTokenActivity(cryptoPort, refreshTokenStore);
    const revokeRefreshTokenActivity = new RevokeRefreshTokenActivity(refreshTokenStore);
    const validateRefreshTokenActivity = new ValidateRefreshTokenActivity(cryptoPort, refreshTokenStore);
    const validateAccessTokenActivity = new ValidateAccessTokenActivity(tokenPort);

    const getRelevantTaskActivity = new GetRelevantTaskActivity(taskPort);
    const createTaskActivity = new CreateTaskActivity(taskPort);
    const updateTaskActivity = new UpdateTaskActivity(taskPort);

    // --- Use Cases ---
    const requestOtpUseCase = new RequestOtpUseCase(mailAdapter, generateOtpActivity);
    const loginWithOtpUseCase = new LoginWithOtpUseCase(generateOtpActivity, generateTokenActivity, issueRefreshTokenActivity);
    const authRefreshUseCase = new AuthRefreshUseCase(generateTokenActivity, validateRefreshTokenActivity, issueRefreshTokenActivity, revokeRefreshTokenActivity);
    const logoutUseCase = new LogoutUseCase(revokeRefreshTokenActivity);
    const getAuthenticatedEmailUseCase = new GetAuthenticatedEmailUseCase(validateAccessTokenActivity);

    const getTaskUseCase = new GetTaskUseCase(getRelevantTaskActivity);
    const createTaskUseCase = new CreateTaskUseCase(createTaskActivity);
    const updateTaskUseCase = new UpdateTaskUseCase(updateTaskActivity);

    await fastify.register(cookie);

    await fastify.register(cors, {
        origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    // --- Routes ---
    await fastify.register(authRoutes, {
        requestOtpUseCase,
        loginWithOtpUseCase,
        authRefreshUseCase,
        logoutUseCase,
    });

    await fastify.register(taskRoutes, {
        getTaskUseCase,
        getAuthenticatedEmailUseCase,
        createTaskUseCase,
        updateTaskUseCase,
    });

    return {fastify, prisma};
}