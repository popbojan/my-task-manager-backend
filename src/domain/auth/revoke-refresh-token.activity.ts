import type { StorePort } from "./store-port";

export class RevokeRefreshTokenActivity {
    constructor(private readonly store: StorePort) {}

    async execute(refreshTokenHash: string): Promise<void> {
        await this.store.deleteRefreshToken(refreshTokenHash);
    }
}