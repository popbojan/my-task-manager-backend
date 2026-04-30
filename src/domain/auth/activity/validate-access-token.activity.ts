import type { TokenPort } from "../port/token.port";

export class ValidateAccessTokenActivity {
  constructor(
    private readonly tokenPort: TokenPort
  ) {}

  async execute(accessToken: string): Promise<{ email: string }> {
    return this.tokenPort.verifyAccessToken(accessToken);
  }
}