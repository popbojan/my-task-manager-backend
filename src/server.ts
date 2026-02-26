import "dotenv/config";
import Fastify from "fastify";

import { authRoutes } from "./adapters/driving/web/auth.route.js";

import { MailerAdapter } from "./adapters/driven/mail/mailer.adapter";

import { RequestOtpUseCase } from "./domain/auth/request-otp.use-case.js";
import { LoginWithOtpUseCase } from "./domain/auth/login-with-otp.use-case.js";

import { GenerateOtpActivity } from "./domain/auth/generate-otp.activity.js";
import { GenerateTokenActivity } from "./domain/auth/generate-token.activity.js";

import cors from '@fastify/cors'

const fastify = Fastify({ logger: true });

import cookie from "@fastify/cookie";
import {AuthRefreshUseCase} from "./domain/auth/auth-refresh.use-case";
import {IssueRefreshTokenActivity} from "./domain/auth/issue-refresh-token.activity";
import {RevokeRefreshTokenActivity} from "./domain/auth/revoke-refresh-token.activity";
import {ValidateRefreshTokenActivity} from "./domain/auth/validate-refresh-token.activity";
import {JwtTokenAdapter} from "./adapters/driven/security/jwt-token.adapter";
import {HmacOtpAdapter} from "./adapters/driven/security/hmac-otp.adapter";

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

// --- Activities (Domain Services) ---
const generateOtpActivity = new GenerateOtpActivity(otpPort);
const generateTokenActivity = new GenerateTokenActivity(tokenPort);
const issueRefreshTokenActivity = new IssueRefreshTokenActivity();
const revokeRefreshTokenActivity = new RevokeRefreshTokenActivity();
const validateRefreshTokenActivity = new ValidateRefreshTokenActivity();

// --- UseCases ---
const requestOtpUseCase = new RequestOtpUseCase(mailAdapter, generateOtpActivity);
const loginWithOtpUseCase = new LoginWithOtpUseCase(generateOtpActivity, generateTokenActivity, issueRefreshTokenActivity);
const authRefreshUseCase = new AuthRefreshUseCase(generateTokenActivity, validateRefreshTokenActivity, issueRefreshTokenActivity, revokeRefreshTokenActivity);

await fastify.register(cookie);

// --- CORS ---
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
});

// --- Routes ---
await fastify.register(authRoutes, {
  requestOtpUseCase,
  loginWithOtpUseCase,
  authRefreshUseCase
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
