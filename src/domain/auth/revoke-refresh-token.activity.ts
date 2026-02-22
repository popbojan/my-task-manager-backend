import { redis } from "../../conf/redis";

export class RevokeRefreshTokenActivity {

    async execute(refreshTokenHash: string) {
        await redis.del(`rt:${refreshTokenHash}`);
    }

}