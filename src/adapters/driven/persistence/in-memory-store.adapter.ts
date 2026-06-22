import type { StorePort } from "../../../domain/auth/port/store-port";
import type {RefreshTokenUser} from "../../../domain/auth/refresh-token-user";

type RefreshTokenEntry = {
    userId: string;
    email: string;
    expiresAt: number;
};

export class InMemoryStoreAdapter implements StorePort {
    private readonly refreshTokens = new Map<string, RefreshTokenEntry>();

    async saveRefreshToken(hashedToken: string, refreshTokenUser: RefreshTokenUser, ttlSeconds: number): Promise<void> {
        const expiresAt = Date.now() + ttlSeconds * 1000;

        this.refreshTokens.set(hashedToken, {
            userId: refreshTokenUser.id,
            email: refreshTokenUser.email,
            expiresAt,
        });
    }

    async deleteRefreshToken(hashedToken: string): Promise<void> {
        this.refreshTokens.delete(hashedToken);
    }

    async getRefreshTokenUser(
        hashedToken: string,
    ): Promise<RefreshTokenUser | null> {
        const entry = this.refreshTokens.get(hashedToken);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.refreshTokens.delete(hashedToken);
            return null;
        }

        return {
            id: entry.userId,
            email: entry.email,
        };
    }
}
