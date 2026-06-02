import type { MailPort } from "../../../domain/auth/port/mail.port";

type ResendMailConfig = {
    apiKey: string;
    from: string;
};

type ResendErrorResponse = {
    message?: string;
    name?: string;
};

export class ResendMailAdapter implements MailPort {
    constructor(private readonly config: ResendMailConfig) {}

    async sendOtp(email: string, code: string): Promise<void> {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: this.config.from,
                to: [email],
                subject: "Your login code",
                text: `Your one-time login code is: ${code}\n\nThis code is valid for 4 minutes.`,
                html: `
        <p>Your one-time login code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</p>
        <p>This code is valid for <b>4 minutes</b>.</p>
      `,
            }),
            signal: AbortSignal.timeout(15_000),
        });

        if (response.ok) {
            return;
        }

        let detail = await response.text();
        try {
            const parsed = JSON.parse(detail) as ResendErrorResponse;
            if (parsed.message) {
                detail = parsed.message;
            }
        } catch {
            // keep raw body
        }

        throw new Error(`Failed to send OTP email via Resend (${response.status}): ${detail}`);
    }
}
