import {createHash} from "crypto";
import {redis} from "../../conf/redis";

function hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export class ValidateRefreshTokenActivity {

    async execute(rawRefreshToken: string) {
        const refreshTokenHash = hash(rawRefreshToken);
        const email = await redis.get(`rt:${refreshTokenHash}`);
        return { email, refreshTokenHash };
    }
}