import "dotenv/config";
import Fastify from "fastify";

import { authRoutes } from "./adapters/driving/web/auth.route.js";
import { taskRoutes } from "./adapters/driving/web/task.route.js";

import { MailerAdapter } from "./adapters/driven/mail/mailer.adapter";

import { RequestOtpUseCase } from "./domain/auth/request-otp.use-case.js";
import { LoginWithOtpUseCase } from "./domain/auth/login-with-otp.use-case.js";
import { GetAuthenticatedEmailUseCase } from "./domain/auth/get-authenticated-email.use-case";

import { GenerateOtpActivity } from "./domain/auth/activity/generate-otp.activity";
import { GenerateTokenActivity } from "./domain/auth/activity/generate-token.activity";
import { ValidateAccessTokenActivity } from "./domain/auth/activity/validate-access-token.activity";
import { GetRelevantTaskActivity } from "./domain/task/activity/get-relevant-task.activity";
import { GetTaskUseCase } from "./domain/task/get-task.use-case";

import { PrismaTaskAdapter } from "./adapters/driven/persistence/prisma-task.adapter";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import cors from '@fastify/cors'

const fastify = Fastify({ logger: true });

import cookie from "@fastify/cookie";
import { AuthRefreshUseCase } from "./domain/auth/auth-refresh.use-case";
import { LogoutUseCase } from "./domain/auth/logout.use-case";
import { IssueRefreshTokenActivity } from "./domain/auth/activity/issue-refresh-token.activity";
import { RevokeRefreshTokenActivity } from "./domain/auth/activity/revoke-refresh-token.activity";
import { ValidateRefreshTokenActivity } from "./domain/auth/activity/validate-refresh-token.activity";
import { JwtTokenAdapter } from "./adapters/driven/security/jwt-token.adapter";
import { HmacOtpAdapter } from "./adapters/driven/security/hmac-otp.adapter";

import { CryptoAdapter } from "./adapters/driven/security/crypto.adapter";
import { InMemoryStoreAdapter } from "./adapters/driven/persistence/in-memory-store.adapter";

// TODO: Define Task Model
// TODO: Define Tasks API
// TODO: Add Linter and prettier

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const taskPort = new PrismaTaskAdapter(prisma);

const refreshTokenStore = new InMemoryStoreAdapter();

// --- Infrastructure ---
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

// --- Activities (Domain Services) ---
const generateOtpActivity = new GenerateOtpActivity(otpPort);
const generateTokenActivity = new GenerateTokenActivity(tokenPort);

const issueRefreshTokenActivity = new IssueRefreshTokenActivity(cryptoPort, refreshTokenStore);
const revokeRefreshTokenActivity = new RevokeRefreshTokenActivity(refreshTokenStore);
const validateRefreshTokenActivity = new ValidateRefreshTokenActivity(cryptoPort, refreshTokenStore);
const validateAccessTokenActivity = new ValidateAccessTokenActivity(tokenPort);

const getRelevantTaskActivity = new GetRelevantTaskActivity(taskPort);

// --- UseCases ---
const requestOtpUseCase = new RequestOtpUseCase(mailAdapter, generateOtpActivity);
const loginWithOtpUseCase = new LoginWithOtpUseCase(generateOtpActivity, generateTokenActivity, issueRefreshTokenActivity);
const authRefreshUseCase = new AuthRefreshUseCase(generateTokenActivity, validateRefreshTokenActivity, issueRefreshTokenActivity, revokeRefreshTokenActivity);
const logoutUseCase = new LogoutUseCase(revokeRefreshTokenActivity);
const getAuthenticatedEmailUseCase =
  new GetAuthenticatedEmailUseCase(validateAccessTokenActivity);

const getTaskUseCase =
  new GetTaskUseCase(getRelevantTaskActivity);

await fastify.register(cookie);

// --- CORS ---
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
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
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    fastify.log.info(`Server is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

process.on("SIGINT", async () => {
  fastify.log.info("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
