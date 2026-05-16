import { createHmac } from "node:crypto";

/** Same OTP derivation as production `HmacOtpAdapter` (must stay aligned with `buildApp` config). */
export function computeTestOtp(
    email: string,
    options?: {
        secret?: string;
        windowSizeSec?: number;
        digits?: number;
        nowUnix?: number;
    },
): string {
    const secret = options?.secret ?? process.env.OTP_SECRET!;
    const windowSizeSec = options?.windowSizeSec ?? 240;
    const digits = options?.digits ?? 6;
    const nowUnix = options?.nowUnix ?? Math.floor(Date.now() / 1000);

    const windowStartUnix =
        Math.floor(nowUnix / windowSizeSec) * windowSizeSec;

    const message = `${email}|${windowStartUnix}`;
    const hmac = createHmac("sha256", secret).update(message).digest();

    const lastByte = hmac.at(-1);
    if (lastByte === undefined) throw new Error("Invalid HMAC buffer");

    const offset = lastByte & 0x0f;
    const mod = 10 ** digits;
    const truncated = (hmac.readUInt32BE(offset) & 0x7fffffff) % mod;

    return truncated.toString().padStart(digits, "0");
}
