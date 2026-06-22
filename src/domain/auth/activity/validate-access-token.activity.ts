import type { TokenPort } from "../port/token.port";
import type { AuthenticatedUser } from "../authenticated-user";

export class ValidateAccessTokenActivity {
    constructor(private readonly tokenPort: TokenPort) {}

    async execute(accessToken: string): Promise<AuthenticatedUser> {
        return this.tokenPort.verifyAccessToken(accessToken);
    }
}
