import type { Redis } from "ioredis";
import type {StorePort} from "../../../domain/auth/store-port";

export class RedisStoreAdapter implements StorePort {
    constructor(private readonly redis: Redis) {}

    async saveRefreshToken(hashedToken: string, email: string, ttlSeconds: number): Promise<void> {
        await this.redis.set(`rt:${hashedToken}`, email, "EX", ttlSeconds);
    }
}