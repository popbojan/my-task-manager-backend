import { createHmac } from "crypto";
import type { OtpPort } from "../../../domain/auth/otp.port";

type OtpConfig = {
    secret: string;
    windowSizeSec: number;
    digits: number;
};

type Clock = { nowUnix(): number };

export class HmacOtpAdapter implements OtpPort {
    constructor(
        private readonly config: OtpConfig,
        private readonly clock: Clock = { nowUnix: () => Math.floor(Date.now() / 1000) },
    ) {}

    generateOtp(email: string): string {
        const nowUnix = this.clock.nowUnix();
        // We divide the current time by the window size (e.g. 240 seconds = 4 minutes),
        // then use Math.floor() to REMOVE the decimal part. This "rounds down" the time
        // to the beginning of the current time block.
        // nowUnix = 1000
        // 1000 / 240 = 4.16
        // Math.floor(4.16) = 4
        // 4 * 240 = 960
        // Result: windowStartUnix = 960 (start of the current 4-minute window)
        // As long as the current time stays between 960 and 1199,
        // windowStartUnix stays the same → OTP stays the same.
        // When time reaches 1200 → new window → new OTP.
        const windowStartUnix =
            Math.floor(nowUnix / this.config.windowSizeSec) * this.config.windowSizeSec;

        const message = `${email}|${windowStartUnix}`;
        const hmac = createHmac("sha256", this.config.secret).update(message).digest();

        const lastByte = hmac.at(-1);
        if (lastByte === undefined) throw new Error("Invalid HMAC buffer");

        const offset = lastByte & 0x0f;
        const mod = 10 ** this.config.digits;
        const truncated = (hmac.readUInt32BE(offset) & 0x7fffffff) % mod;

        return truncated.toString().padStart(this.config.digits, "0");
    }
}