import type { GenerateOtpActivity } from "./generate-otp.activity.js";
import type { GenerateTokenActivity } from "./generate-token.activity.js";
import type { IssueRefreshTokenActivity } from "./issue-refresh-token.activity";

export class LoginWithOtpUseCase {
    constructor(
        private generateOtpActivity: GenerateOtpActivity,
        private generateTokenActivity: GenerateTokenActivity,
        private issueRefreshTokenActivity: IssueRefreshTokenActivity
    ) {}

    async execute(email: string, otpFromClient: string): Promise<{ accessToken: string; refreshToken: string; refreshTtlSeconds: number } | null> {
        const expectedCode = this.generateOtpActivity.execute(email);
        const isValid = expectedCode === otpFromClient.trim();

        if (!isValid) return null;

        const accessToken = this.generateTokenActivity.execute(email);
        const { refreshToken, ttlSeconds } = await this.issueRefreshTokenActivity.execute(email);

        return { accessToken, refreshToken, refreshTtlSeconds: ttlSeconds };
    }
}