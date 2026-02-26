import type {CryptoPort} from "../port/crypto-port";
import type {StorePort} from "../port/store-port";
import {InvalidRefreshTokenError} from "../exception/invalid-refresh-token-error";

export class ValidateRefreshTokenActivity {
    constructor(
        private readonly cryptoPort: CryptoPort,
        private readonly store: StorePort
    ) {}

    async execute(rawRefreshToken: string) {

        const refreshTokenHash = this.cryptoPort.sha256Hex(rawRefreshToken);

        const email = await this.store.getRefreshTokenEmail(refreshTokenHash);

        if (!email) {
            throw new InvalidRefreshTokenError();
        }

        return { email, refreshTokenHash };
    }
}