import type { MailPort } from "../../../domain/auth/port/mail.port";
import { MailerAdapter } from "./mailer.adapter.js";
import { ResendMailAdapter } from "./resend-mail.adapter.js";

/** Production mail: Resend when `RESEND_API_KEY` is set, otherwise SMTP (local dev). */
export function createMailAdapter(): MailPort {
    const from = process.env.MAIL_FROM;
    if (from === undefined || from.length === 0) {
        throw new Error("MAIL_FROM environment variable is required");
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey !== undefined && resendApiKey.length > 0) {
        return new ResendMailAdapter({ apiKey: resendApiKey, from });
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "RESEND_API_KEY is required in production (Railway blocks SMTP ports 587/465)",
        );
    }

    return new MailerAdapter({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
        from,
    });
}
