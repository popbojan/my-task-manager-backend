import type { MailPort } from "./port/mail.port";
import type { GenerateOtpActivity } from "./activity/generate-otp.activity";
import type { RegisterUserActivity } from "../user/activity/register-user.activity";
import type { Language } from "../user/model/language";

export class RequestOtpUseCase {
    constructor(
        private mailPort: MailPort,
        private generateOtpActivity: GenerateOtpActivity,
        private registerUserActivity: RegisterUserActivity,
    ) {}

    async execute(email: string, language: Language): Promise<void> {
        await this.registerUserActivity.execute(email, language);

        const code = this.generateOtpActivity.execute(email);
        await this.mailPort.sendOtp(email, code, language);
    }
}
