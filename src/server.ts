import "dotenv/config";
import Fastify from "fastify";

import { authRoutes } from "./adapters/driving/web/auth.route.js";

import { NodemailerMailAdapter } from "./adapters/driven/mail/nodemailer.mail.adapter.js";

import { RequestOtpUseCase } from "./domain/auth/request-otp.use-case.js";
import { LoginWithOtpUseCase } from "./domain/auth/login-with-otp.use-case.js";

import { GenerateOtpActivity } from "./domain/auth/generate-otp.activity.js";
import { GenerateTokenActivity } from "./domain/auth/generate-token.activity.js";

import cors from '@fastify/cors'

const fastify = Fastify({ logger: true });

// --- Infrastructure ---
const mailAdapter = new NodemailerMailAdapter({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER!,
  pass: process.env.SMTP_PASS!,
  from: process.env.MAIL_FROM!,
});

// --- Activities (Domain Services) ---
const generateOtpActivity = new GenerateOtpActivity();
const generateTokenActivity = new GenerateTokenActivity();

// --- UseCases ---
const requestOtpUseCase = new RequestOtpUseCase(mailAdapter, generateOtpActivity);
const loginWithOtpUseCase = new LoginWithOtpUseCase(generateOtpActivity, generateTokenActivity);

// --- CORS ---
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
});

// --- Routes ---
await fastify.register(authRoutes, {
  requestOtpUseCase,
  loginWithOtpUseCase,
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
