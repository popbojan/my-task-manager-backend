import jwt from "jsonwebtoken";
import type { TokenPort } from "../../../domain/auth/port/token.port";
import { InvalidAccessTokenError } from "../../../domain/auth/exception/invalid-access-token-error.js";
import type {RefreshTokenUser} from "../../../domain/auth/refresh-token-user";
import type {AuthenticatedUser} from "../../../domain/auth/authenticated-user";

type JwtConfig = {
    secret: jwt.Secret;
    expiresIn?: jwt.SignOptions["expiresIn"];
    algorithm: Exclude<jwt.Algorithm, "none">;
};

export class JwtTokenAdapter implements TokenPort {
    constructor(private readonly config: JwtConfig) {}

    generateAccessToken(refreshTokenUser: RefreshTokenUser): string {
        return jwt.sign({
            sub: refreshTokenUser.id,
            email: refreshTokenUser.email,
        }, this.config.secret, {
            ...(this.config.expiresIn !== undefined ? { expiresIn: this.config.expiresIn } : {}),
            algorithm: this.config.algorithm,
        });
    }

    verifyAccessToken(token: string): AuthenticatedUser {
        const decoded = jwt.verify(token, this.config.secret, {
            algorithms: [this.config.algorithm],
        });

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.sub !== "string" ||
            typeof decoded.email !== "string"
        ) {
            throw new InvalidAccessTokenError();
        }

        return {
            id: decoded.sub,
            email: decoded.email,
        };
    }
}
