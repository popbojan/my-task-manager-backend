import type { ValidateRefreshTokenActivity } from "./activity/validate-refresh-token.activity";
import type { RevokeRefreshTokenActivity } from "./activity/revoke-refresh-token.activity";

export class LogoutUseCase {
    constructor(
        private validateRefreshTokenActivity: ValidateRefreshTokenActivity,
        private revokeRefreshTokenActivity: RevokeRefreshTokenActivity,
    ) {}

    async execute(refreshToken: string): Promise<void> {
        const { refreshTokenHash } =
            await this.validateRefreshTokenActivity.execute(refreshToken);

        await this.revokeRefreshTokenActivity.execute(refreshTokenHash);
    }
}
