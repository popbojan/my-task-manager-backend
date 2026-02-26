import jwt from "jsonwebtoken";
import type {TokenPort} from "../../../domain/auth/token.port";

type JwtConfig = {
    secret: jwt.Secret;
    expiresIn?: jwt.SignOptions["expiresIn"];
    algorithm: Exclude<jwt.Algorithm, "none">;
};

export class JwtTokenAdapter implements TokenPort {
    constructor(private readonly config: JwtConfig) {
    }

    generateAccessToken(payload: { email: string }): string {
        return jwt.sign(payload, this.config.secret, {
            ...(this.config.expiresIn !== undefined ? {expiresIn: this.config.expiresIn} : {}),
            algorithm: this.config.algorithm,
        });
    }
}