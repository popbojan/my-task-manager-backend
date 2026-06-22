import type { GenerateOtpActivity } from "./activity/generate-otp.activity";
import type { GenerateTokenActivity } from "./activity/generate-token.activity";
import type { IssueRefreshTokenActivity } from "./activity/issue-refresh-token.activity";
import type { RegisterUserActivity } from "../user/activity/register-user.activity";
import type { Language } from "../user/model/language";

export class LoginWithOtpUseCase {
    constructor(
        private generateOtpActivity: GenerateOtpActivity,
        private generateTokenActivity: GenerateTokenActivity,
        private issueRefreshTokenActivity: IssueRefreshTokenActivity,
        private registerUserActivity: RegisterUserActivity,
    ) {}

    async execute(
        email: string,
        otpFromClient: string,
        language: Language,
    ): Promise<{ accessToken: string; refreshToken: string; refreshTtlSeconds: number } | null> {
        const expectedCode = this.generateOtpActivity.execute(email);
        const isValid = expectedCode === otpFromClient.trim();

        if (!isValid) return null;

        const user = await this.registerUserActivity.execute(email, language);

        const accessToken = this.generateTokenActivity.execute({id: user.id, email: user.email});
        const { refreshToken, ttlSeconds } = await this.issueRefreshTokenActivity.execute({id: user.id, email: user.email});

        return { accessToken, refreshToken, refreshTtlSeconds: ttlSeconds };
    }
}
