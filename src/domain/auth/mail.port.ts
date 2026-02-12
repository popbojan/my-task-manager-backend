export interface MailPort {
    /**
     * Sends an OTP code to a specific email address.
     * This is a "Driven Port" that our domain uses to talk to the outside world.
     */
    sendOtp(email: string, code: string): Promise<void>;
}