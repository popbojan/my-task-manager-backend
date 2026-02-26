import type { OtpPort } from "../port/otp.port";

export class GenerateOtpActivity {
    constructor(private readonly otpPort: OtpPort) {}

    execute(email: string): string {
        return this.otpPort.generateOtp(email);
    }
}