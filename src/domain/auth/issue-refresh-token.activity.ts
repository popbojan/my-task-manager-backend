import { createHash, randomBytes } from "crypto";
import { redis } from "../../conf/redis";

const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 Days

function hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export class IssueRefreshTokenActivity {

    async execute(email: string) {
        const refreshToken = randomBytes(32).toString("hex");
        const refreshTokenHash = hash(refreshToken);

        await redis.set(`rt:${refreshTokenHash}`, email, "EX", REFRESH_TTL_SECONDS);

        return {refreshToken, refreshTokenHash, ttlSeconds: REFRESH_TTL_SECONDS};
    }
}