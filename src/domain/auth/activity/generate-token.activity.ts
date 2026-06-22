import type { TokenPort } from "../port/token.port";
import type {RefreshTokenUser} from "../refresh-token-user";

export class GenerateTokenActivity {
    constructor(private readonly tokenPort: TokenPort) {}

    execute(refreshTokenUser: RefreshTokenUser): string {
        return this.tokenPort.generateAccessToken(refreshTokenUser);
    }
}
