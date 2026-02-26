import type { TokenPort } from "./token.port";

export class GenerateTokenActivity {
    constructor(private readonly tokenPort: TokenPort) {}

    execute(email: string): string {
        return this.tokenPort.generateAccessToken({ email });
    }
}