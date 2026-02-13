import "dotenv/config";
import Fastify from "fastify";

import { authRoutes } from "./adapters/driving/web/auth.route.js";

import { NodemailerMailAdapter } from "./adapters/driven/mail/nodemailer.mail.adapter.js";

import { RequestOtpUseCase } from "./domain/auth/request-otp.use-case.js";
import { LoginWithOtpUseCase } from "./domain/auth/login-with-otp.use-case.js";

import { GenerateOtpActivity } from "./domain/auth/generate-otp.activity.js";
import { GenerateTokenActivity } from "./domain/auth/generate-token.activity.js";

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

// --- Routes ---
await fastify.register(authRoutes, {
  requestOtpUseCase,
  loginWithOtpUseCase,
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    fastify.log.info("Server is running on http://localhost:3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
