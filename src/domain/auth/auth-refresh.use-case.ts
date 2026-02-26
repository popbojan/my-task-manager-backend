import type { GenerateTokenActivity } from "./activity/generate-token.activity";
import type { ValidateRefreshTokenActivity } from "./activity/validate-refresh-token.activity";
import type { IssueRefreshTokenActivity } from "./activity/issue-refresh-token.activity";
import type { RevokeRefreshTokenActivity } from "./activity/revoke-refresh-token.activity";

export class AuthRefreshUseCase {
    constructor(
        private generateTokenActivity: GenerateTokenActivity,
        private validateRefreshTokenActivity: ValidateRefreshTokenActivity,
        private issueRefreshTokenActivity: IssueRefreshTokenActivity,
        private revokeRefreshTokenActivity: RevokeRefreshTokenActivity
    ) {}

    async execute(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string; refreshTtlSeconds: number } | null> {
        const { email, refreshTokenHash } = await this.validateRefreshTokenActivity.execute(rawRefreshToken);

        // Rotation
        await this.revokeRefreshTokenActivity.execute(refreshTokenHash);
        const { refreshToken, ttlSeconds } = await this.issueRefreshTokenActivity.execute(email);

        const accessToken = this.generateTokenActivity.execute(email);

        return { accessToken, refreshToken, refreshTtlSeconds: ttlSeconds };
    }
}