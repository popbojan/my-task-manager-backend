import { redis } from "../../conf/redis";

//TODO: to be refactored to move storage functionality out of the domain
export class RevokeRefreshTokenActivity {

    async execute(refreshTokenHash: string) {
        await redis.del(`rt:${refreshTokenHash}`);
    }

}