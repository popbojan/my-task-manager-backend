import "dotenv/config";
import Fastify from 'fastify';
import { AuthService } from "./domain/auth/auth.service";
import { NodemailerMailAdapter } from "./adapters/driven/mail/nodemailer.mail.adapter";
import { authRoutes } from "./adapters/driving/web/auth.route";

const fastify = Fastify({
  logger: true
});

const mailAdapter = new NodemailerMailAdapter({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER!,
  pass: process.env.SMTP_PASS!,
  from: process.env.MAIL_FROM!,
});

const authService = new AuthService(mailAdapter);

await fastify.register(authRoutes, {
  authService,
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log("Server is running on http://localhost:3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
