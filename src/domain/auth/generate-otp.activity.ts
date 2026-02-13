import { createHmac } from "crypto";

export class GenerateOtpActivity {
    private readonly OTP_SECRET: string;
    private readonly WINDOW_SIZE_SEC = 240;

    constructor() {
        if (!process.env.OTP_SECRET) {
            throw new Error("OTP_SECRET is not defined");
        }
        this.OTP_SECRET = process.env.OTP_SECRET;
    }

    execute(email: string): string {
        const nowUnix = Math.floor(Date.now() / 1000);
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
            Math.floor(nowUnix / this.WINDOW_SIZE_SEC) * this.WINDOW_SIZE_SEC;

        const message = `${email}|${windowStartUnix}`;
        const hmac = createHmac("sha256", this.OTP_SECRET).update(message).digest();

        const lastByte = hmac.at(-1);
        if (lastByte === undefined) throw new Error("Invalid HMAC buffer");

        const offset = lastByte & 0x0f; // 0..15
        const truncated =
            (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;

        return truncated.toString().padStart(6, "0");
    }
}
