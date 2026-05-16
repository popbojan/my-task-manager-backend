import type { MailPort } from "../../src/domain/auth/port/mail.port.js";

/** No-op mailer for integration tests (no SMTP). */
export class StubMailAdapter implements MailPort {
    async sendOtp(_email: string, _code: string): Promise<void> {}
}
