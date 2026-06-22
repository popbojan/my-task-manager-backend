import type { MailPort } from "../../../domain/auth/port/mail.port";
import { otpEmailTranslations } from "./i18n/otp-email.translations";
import type {Language} from "../../../domain/user/model/language";

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

    async sendOtp(email: string, code: string, language: Language): Promise<void> {
        const t = otpEmailTranslations[language] ?? otpEmailTranslations.en;
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: this.config.from,
                to: [email],
                subject: t.subject,
                text: `${t.intro} ${code}\n\n${t.validFor}`,
                html: `
            <p>${t.intro}</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${code}</p>
            <p>${t.validFor}</p>
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
