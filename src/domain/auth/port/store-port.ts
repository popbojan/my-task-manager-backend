import type {RefreshTokenUser} from "../refresh-token-user";

export interface StorePort {
    saveRefreshToken(hashedToken: string, refreshTokenUser: RefreshTokenUser, ttlSeconds: number): Promise<void>;

    deleteRefreshToken(hashedToken: string): Promise<void>;

    getRefreshTokenUser(hashedToken: string): Promise<RefreshTokenUser | null>;
}
