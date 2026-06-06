import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { authRoutes } from "./adapters/driving/web/auth.route.js";
import { taskRoutes } from "./adapters/driving/web/task.route.js";
import { recurringTaskRoutes } from "./adapters/driving/web/recurring-tasks.route.js";

import { createMailAdapter } from "./adapters/driven/mail/create-mail.adapter.js";
import { JwtTokenAdapter } from "./adapters/driven/security/jwt-token.adapter.js";
import { HmacOtpAdapter } from "./adapters/driven/security/hmac-otp.adapter.js";
import { CryptoAdapter } from "./adapters/driven/security/crypto.adapter.js";
import { InMemoryStoreAdapter } from "./adapters/driven/persistence/in-memory-store.adapter.js";
import { PrismaTaskAdapter } from "./adapters/driven/persistence/prisma-task.adapter.js";
import { PrismaRecurringTaskAdapter } from "./adapters/driven/persistence/prisma-recurring-task.adapter.js";

import { RequestOtpUseCase } from "./domain/auth/request-otp.use-case.js";
import { LoginWithOtpUseCase } from "./domain/auth/login-with-otp.use-case.js";
import { AuthRefreshUseCase } from "./domain/auth/auth-refresh.use-case.js";
import { LogoutUseCase } from "./domain/auth/logout.use-case.js";
import { GetAuthenticatedEmailUseCase } from "./domain/auth/get-authenticated-email.use-case.js";
import { GenerateOtpActivity } from "./domain/auth/activity/generate-otp.activity.js";

import { GenerateTokenActivity } from "./domain/auth/activity/generate-token.activity.js";
import { IssueRefreshTokenActivity } from "./domain/auth/activity/issue-refresh-token.activity.js";
import { RevokeRefreshTokenActivity } from "./domain/auth/activity/revoke-refresh-token.activity.js";
import { ValidateRefreshTokenActivity } from "./domain/auth/activity/validate-refresh-token.activity.js";
import { ValidateAccessTokenActivity } from "./domain/auth/activity/validate-access-token.activity.js";

import { CreateTaskActivity } from "./domain/task/activity/create-task.activity.js";
import { GetRelevantTaskActivity } from "./domain/task/activity/get-relevant-task.activity.js";
import { UpdateTaskActivity } from "./domain/task/activity/update-task.activity.js";
import { GetTaskByIdActivity } from "./domain/task/activity/get-task-by-id.activity.js";
import { DeleteTaskActivity } from "./domain/task/activity/delete-task.activity.js";

import { CreateTaskUseCase } from "./domain/task/create-task.use-case.js";
import { GetTasksUseCase } from "./domain/task/get-tasks.use-case";
import { UpdateTaskUseCase } from "./domain/task/update-task.use-case.js";
import { GetTaskByIdUseCase } from "./domain/task/get-task-by-id.use-case.js";
import { DeleteTaskUseCase } from "./domain/task/delete-task.use-case.js";

import { GetRelevantRecurringTaskActivity } from "./domain/recurring-task/activity/get-relevant-recurring-task.activity.js";
import { CreateRecurringTaskActivity } from "./domain/recurring-task/activity/create-recurring-task.activity.js";
import { UpdateRecurringTaskActivity } from "./domain/recurring-task/activity/update-recurring-task.activity.js";
import { GetRecurringTaskByIdActivity } from "./domain/recurring-task/activity/get-recurring-task-by-id.activity.js";
import { DeleteRecurringTaskActivity } from "./domain/recurring-task/activity/delete-recurring-task.activity.js";
import { GetRecurringTaskProgressActivity } from "./domain/recurring-task/activity/get-recurring-task-progress.activity.js";
import { ResetDueRecurringTasksActivity } from "./domain/recurring-task/activity/reset-due-recurring-tasks.activity.js";
import { CalculateNextResetAtActivity } from "./domain/recurring-task/activity/calculate-next-reset-at.activity.js";
import { AdjustStreakOnStatusChangeActivity } from "./domain/recurring-task/activity/adjust-streak-on-status-change.activity.js";
import { ResolveAllTasksStreakActivity } from "./domain/recurring-task/activity/resolve-all-tasks-streak.activity.js";
import { AreAllDailyTasksDoneActivity } from "./domain/recurring-task/activity/are-all-daily-tasks-done.activity.js";
import { BuildRecurringTaskResetUpdateActivity } from "./domain/recurring-task/activity/build-recurring-task-reset-update.activity.js";
import { FindDueRecurringTasksActivity } from "./domain/recurring-task/activity/find-due-recurring-tasks.activity.js";
import { BuildRecurringTaskProgressUpdatesActivity } from "./domain/recurring-task/activity/build-recurring-task-progress-updates.activity.js";

import { GetRecurringTasksUseCase } from "./domain/recurring-task/get-recurring-tasks.use-case.js";
import { CreateRecurringTaskUseCase } from "./domain/recurring-task/create-recurring-task.use-case.js";
import { UpdateRecurringTaskUseCase } from "./domain/recurring-task/update-recurring-task.use-case.js";
import { GetRecurringTaskByIdUseCase } from "./domain/recurring-task/get-recurring-task-by-id.use-case.js";
import { DeleteRecurringTaskUseCase } from "./domain/recurring-task/delete-recurring-task.use-case.js";
import { GetRecurringTaskProgressUseCase } from "./domain/recurring-task/get-recurring-task-progress.use-case.js";
import { ResetDueRecurringTasksUseCase } from "./domain/recurring-task/reset-due-recurring-tasks.use-case.js";

import { loadOpenApiRuntimeSpec } from "./adapters/driving/web/openapi/openapi-runtime-schema";
import type { OpenApiPathsDocument } from "./adapters/driving/web/openapi/openapi-paths-document.types.js";
import type { MailPort } from "./domain/auth/port/mail.port.js";

export type BuildAppOptions = {
    /** When set (e.g. integration tests), skips real SMTP configuration. */
    mailPort?: MailPort;
};

export async function buildApp(options?: BuildAppOptions) {
    const fastify = Fastify({ logger: true });

    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
    });

    const prisma = new PrismaClient({ adapter });

    const taskPort = new PrismaTaskAdapter(prisma);
    const resolveAllTasksStreakActivity = new ResolveAllTasksStreakActivity();
    const recurringTaskPort = new PrismaRecurringTaskAdapter(
        prisma,
        resolveAllTasksStreakActivity,
    );
    const refreshTokenStore = new InMemoryStoreAdapter();

    const mailAdapter = options?.mailPort ?? createMailAdapter();

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
    //                  -- auth --
    const generateOtpActivity = new GenerateOtpActivity(otpPort);
    const generateTokenActivity = new GenerateTokenActivity(tokenPort);
    const issueRefreshTokenActivity = new IssueRefreshTokenActivity(cryptoPort, refreshTokenStore);
    const revokeRefreshTokenActivity = new RevokeRefreshTokenActivity(refreshTokenStore);
    const validateRefreshTokenActivity = new ValidateRefreshTokenActivity(
        cryptoPort,
        refreshTokenStore,
    );
    const validateAccessTokenActivity = new ValidateAccessTokenActivity(tokenPort);

    //                  -- task --
    const getRelevantTaskActivity = new GetRelevantTaskActivity(taskPort);
    const createTaskActivity = new CreateTaskActivity(taskPort);
    const updateTaskActivity = new UpdateTaskActivity(taskPort);
    const getTaskByIdActivity = new GetTaskByIdActivity(taskPort);
    const deleteTaskActivity = new DeleteTaskActivity(taskPort);

    //                  -- recurring task --
    const getRelevantRecurringTaskActivity = new GetRelevantRecurringTaskActivity(
        recurringTaskPort,
    );
    const createRecurringTaskActivity = new CreateRecurringTaskActivity(recurringTaskPort);
    const getRecurringTaskByIdActivity = new GetRecurringTaskByIdActivity(recurringTaskPort);
    const deleteRecurringTaskActivity = new DeleteRecurringTaskActivity(recurringTaskPort);
    const getRecurringTaskProgressActivity = new GetRecurringTaskProgressActivity(recurringTaskPort);
    const calculateNextResetAtActivity = new CalculateNextResetAtActivity();
    const adjustStreakOnStatusChangeActivity = new AdjustStreakOnStatusChangeActivity();
    const updateRecurringTaskActivity = new UpdateRecurringTaskActivity(recurringTaskPort);
    const areAllDailyTasksDoneActivity = new AreAllDailyTasksDoneActivity();
    const buildRecurringTaskResetUpdateActivity = new BuildRecurringTaskResetUpdateActivity(
        calculateNextResetAtActivity,
    );
    const findDueRecurringTasksActivity = new FindDueRecurringTasksActivity(recurringTaskPort);
    const buildRecurringTaskProgressUpdatesActivity = new BuildRecurringTaskProgressUpdatesActivity(
        recurringTaskPort,
        areAllDailyTasksDoneActivity,
    );
    const resetDueRecurringTasksActivity = new ResetDueRecurringTasksActivity(recurringTaskPort);

    // --- Use Cases ---
    //                  -- auth --
    const requestOtpUseCase = new RequestOtpUseCase(mailAdapter, generateOtpActivity);
    const loginWithOtpUseCase = new LoginWithOtpUseCase(
        generateOtpActivity,
        generateTokenActivity,
        issueRefreshTokenActivity,
    );
    const authRefreshUseCase = new AuthRefreshUseCase(
        generateTokenActivity,
        validateRefreshTokenActivity,
        issueRefreshTokenActivity,
        revokeRefreshTokenActivity,
    );
    const logoutUseCase = new LogoutUseCase(
        validateRefreshTokenActivity,
        revokeRefreshTokenActivity,
    );
    const getAuthenticatedEmailUseCase = new GetAuthenticatedEmailUseCase(
        validateAccessTokenActivity,
    );

    //                  -- task --
    const getTaskUseCase = new GetTasksUseCase(getRelevantTaskActivity);
    const createTaskUseCase = new CreateTaskUseCase(createTaskActivity);
    const updateTaskUseCase = new UpdateTaskUseCase(getTaskByIdActivity, updateTaskActivity);
    const getTaskByIdUseCase = new GetTaskByIdUseCase(getTaskByIdActivity);
    const deleteTaskUseCase = new DeleteTaskUseCase(getTaskByIdActivity, deleteTaskActivity);

    //                  -- recurring task --
    const getRecurringTasksUseCase = new GetRecurringTasksUseCase(
        getRelevantRecurringTaskActivity,
    );
    const createRecurringTaskUseCase = new CreateRecurringTaskUseCase(
        createRecurringTaskActivity,
        calculateNextResetAtActivity,
    );
    const updateRecurringTaskUseCase = new UpdateRecurringTaskUseCase(
        getRecurringTaskByIdActivity,
        updateRecurringTaskActivity,
        adjustStreakOnStatusChangeActivity,
        calculateNextResetAtActivity,
    );
    const getRecurringTaskByIdUseCase = new GetRecurringTaskByIdUseCase(
        getRecurringTaskByIdActivity,
    );
    const deleteRecurringTaskUseCase = new DeleteRecurringTaskUseCase(
        getRecurringTaskByIdActivity,
        deleteRecurringTaskActivity,
    );
    const getRecurringTaskProgressUseCase = new GetRecurringTaskProgressUseCase(
        getRecurringTaskProgressActivity,
    );
    const resetDueRecurringTasksUseCase = new ResetDueRecurringTasksUseCase(
        findDueRecurringTasksActivity,
        buildRecurringTaskResetUpdateActivity,
        buildRecurringTaskProgressUpdatesActivity,
        resetDueRecurringTasksActivity,
    );

    await fastify.register(cookie);

    const allowedOrigins = (
        process.env.CORS_ORIGIN ?? "http://localhost:5173"
    ).split(",");

    await fastify.register(cors, {
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) {
                cb(null, true);
                return;
            }

            cb(new Error("Not allowed by CORS"), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    const openApiSpec = (await loadOpenApiRuntimeSpec()) as OpenApiPathsDocument;

    // --- Routes ---
    await fastify.register(authRoutes, {
        requestOtpUseCase,
        loginWithOtpUseCase,
        authRefreshUseCase,
        logoutUseCase,
        openApiSpec,
    });

    await fastify.register(taskRoutes, {
        getTaskUseCase,
        getAuthenticatedEmailUseCase,
        createTaskUseCase,
        updateTaskUseCase,
        getTaskByIdUseCase,
        deleteTaskUseCase,
        openApiSpec,
    });

    await fastify.register(recurringTaskRoutes, {
        getRecurringTasksUseCase,
        getAuthenticatedEmailUseCase,
        createRecurringTaskUseCase,
        updateRecurringTaskUseCase,
        getRecurringTaskByIdUseCase,
        deleteRecurringTaskUseCase,
        getRecurringTaskProgressUseCase,
        openApiSpec,
    });

    return { fastify, prisma, resetDueRecurringTasksUseCase };
}
