import type { CryptoPort } from "../port/crypto-port";
import type { StorePort } from "../port/store-port";
import type {RefreshTokenUser} from "../refresh-token-user";

export class IssueRefreshTokenActivity {
    private readonly TTL = 60 * 60 * 24 * 14;

    constructor(
        private readonly cryptoPort: CryptoPort,
        private readonly storePort: StorePort,
    ) {}

    async execute(refreshTokenUser: RefreshTokenUser) {
        const refreshToken = this.cryptoPort.randomHex(32);
        const refreshTokenHash = this.cryptoPort.sha256Hex(refreshToken);

        await this.storePort.saveRefreshToken(refreshTokenHash, refreshTokenUser, this.TTL);

        return { refreshToken, refreshTokenHash, ttlSeconds: this.TTL };
    }
}
