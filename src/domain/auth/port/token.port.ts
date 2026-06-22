import type {RefreshTokenUser} from "../refresh-token-user";
import type {AuthenticatedUser} from "../authenticated-user";

export interface TokenPort {
    generateAccessToken(refreshTokenUser: RefreshTokenUser): string;

    verifyAccessToken(token: string): AuthenticatedUser;
}
