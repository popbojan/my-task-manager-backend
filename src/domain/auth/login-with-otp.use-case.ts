import type { GenerateOtpActivity } from "./generate-otp.activity.js";
import type { GenerateTokenActivity } from "./generate-token.activity.js";

export class LoginWithOtpUseCase {
    constructor(
        private generateOtpActivity: GenerateOtpActivity,
        private generateTokenActivity: GenerateTokenActivity // Neu dazu!
    ) {}

    async execute(email: string, otpFromClient: string): Promise<string | null> {
        const expectedCode = this.generateOtpActivity.execute(email);
        const isValid = expectedCode === otpFromClient.trim();

        if (!isValid) {
            return null;
        }
        return this.generateTokenActivity.execute(email);
    }
}