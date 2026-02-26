import type {MailPort} from "./port/mail.port";
import type {GenerateOtpActivity} from "./activity/generate-otp.activity";

export class RequestOtpUseCase {
    constructor(
        private mailPort: MailPort,
        private generateOtpActivity: GenerateOtpActivity
    ) {}

    async execute(email: string): Promise<void> {
        const code = this.generateOtpActivity.execute(email);
        await this.mailPort.sendOtp(email, code);
    }
}