import type { RevokeRefreshTokenActivity } from "./activity/revoke-refresh-token.activity";

export class LogoutUseCase {
    constructor(
        private revokeRefreshTokenActivity: RevokeRefreshTokenActivity
    ) {}

    async execute(refreshToken: string): Promise<void> {
        await this.revokeRefreshTokenActivity.execute(refreshToken);
    }
}