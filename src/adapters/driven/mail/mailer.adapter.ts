import nodemailer, { Transporter } from "nodemailer";
import type { MailPort } from "../../../domain/auth/mail.port";

type MailConfig = {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
};

export class MailerAdapter implements MailPort {
    private transporter: Transporter;
    private from: string;

    constructor(config: MailConfig) {
        this.from = config.from;

        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            service: "gmail",
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
    }

    async sendOtp(email: string, code: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.from,
            to: email,
            subject: "Your login code",
            text: `Your one-time login code is: ${code}\n\nThis code is valid for 4 minutes.`,
            html: `
        <p>Your one-time login code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</p>
        <p>This code is valid for <b>4 minutes</b>.</p>
      `,
        });
    }
}
