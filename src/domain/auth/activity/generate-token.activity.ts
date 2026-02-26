import type { TokenPort } from "../port/token.port";

export class GenerateTokenActivity {
    constructor(private readonly tokenPort: TokenPort) {}

    execute(email: string): string {
        return this.tokenPort.generateAccessToken({ email });
    }
}