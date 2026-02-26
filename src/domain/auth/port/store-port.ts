export interface StorePort {

    saveRefreshToken(hashedToken: string, email: string, ttlSeconds: number): Promise<void>;

    deleteRefreshToken(hashedToken: string): Promise<void>;

    getRefreshTokenEmail(hashedToken: string): Promise<string | null>;
}