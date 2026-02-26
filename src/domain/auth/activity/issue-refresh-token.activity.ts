import type {CryptoPort} from "../port/crypto-port";
import type {StorePort} from "../port/store-port";

export class IssueRefreshTokenActivity {
    private readonly TTL = 60 * 60 * 24 * 14;

    constructor(
        private readonly cryptoPort: CryptoPort,
        private readonly storePort: StorePort
    ) {}

    async execute(email: string) {
        const refreshToken = this.cryptoPort.randomHex(32);
        const refreshTokenHash = this.cryptoPort.sha256Hex(refreshToken);

        await this.storePort.saveRefreshToken(refreshTokenHash, email, this.TTL);

        return { refreshToken, refreshTokenHash, ttlSeconds: this.TTL };
    }
}