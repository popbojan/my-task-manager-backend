import {createHmac} from "crypto";
import type {MailPort} from "./mail.port";

const OTP_SECRET = process.env.OTP_SECRET!;
const WINDOW_SIZE_SEC = 240;

export class AuthService {
    constructor(
        private mailPort: MailPort
    ) {
    }

    async requestOtp(email: string): Promise<void> {
        // windowStartUnix = start of the current OTP time window (UNIX timestamp in seconds)
        // How it works (simple explanation):
        // We divide the current time by the window size (e.g. 240 seconds = 4 minutes),
        // then use Math.floor() to REMOVE the decimal part. This "rounds down" the time
        // to the beginning of the current time block.
        // Example:
        // nowUnix = 1000
        // 1000 / 240 = 4.16
        // Math.floor(4.16) = 4
        // 4 * 240 = 960
        // Result: windowStartUnix = 960 (start of the current 4-minute window)
        // As long as the current time stays between 960 and 1199,
        // windowStartUnix stays the same → OTP stays the same.
        // When time reaches 1200 → new window → new OTP.
        const nowUnix = Math.floor(Date.now() / 1000);
        const windowStartUnix =
            Math.floor(nowUnix / WINDOW_SIZE_SEC) * WINDOW_SIZE_SEC;

        const code = this.generateOtp({
            email,
            windowStartUnix
        });

        await this.mailPort.sendOtp(email, code);
    }

    verifyOtp(email: string, otpFromClient: string): boolean {
        const nowUnix = Math.floor(Date.now() / 1000);
        const currentWindowStart =
            Math.floor(nowUnix / WINDOW_SIZE_SEC) * WINDOW_SIZE_SEC;

        const expected = this.generateOtp({
            email,
            windowStartUnix: currentWindowStart
        });

        return expected === otpFromClient.trim();
    }

    private generateOtp(params: {
        email: string;
        windowStartUnix: number;
    }): string {

        const message =
            `${params.email}|${params.windowStartUnix}`;

        const hmac = createHmac("sha256", OTP_SECRET)
            .update(message)
            .digest();

        const lastByte = hmac.at(-1);
        if (lastByte === undefined) {
            throw new Error("Invalid HMAC buffer");
        }

        const offset = lastByte & 0x0f;
        const truncated = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;

        return truncated.toString().padStart(6, "0");
    }
}
