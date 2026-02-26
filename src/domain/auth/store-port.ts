export interface StorePort {

    saveRefreshToken(hashedToken: string, email: string, ttlSeconds: number): Promise<void>;
}