import type { Redis } from "ioredis";
import type {StorePort} from "../../../domain/auth/port/store-port";

export class RedisStoreAdapter implements StorePort {
    constructor(private readonly redis: Redis) {}

    async saveRefreshToken(hashedToken: string, email: string, ttlSeconds: number): Promise<void> {
        await this.redis.set(`rt:${hashedToken}`, email, "EX", ttlSeconds);
    }

    async deleteRefreshToken(hashedToken: string): Promise<void> {
        await this.redis.del(`rt:${hashedToken}`);
    }

    async getRefreshTokenEmail(hashedToken: string): Promise<string | null> {
        return this.redis.get(`rt:${hashedToken}`);
    }
}