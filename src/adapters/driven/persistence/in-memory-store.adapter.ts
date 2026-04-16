import type { StorePort } from "../../../domain/auth/port/store-port";

type RefreshTokenEntry = {
  email: string;
  expiresAt: number;
};

export class InMemoryStoreAdapter implements StorePort {
  private readonly refreshTokens = new Map<string, RefreshTokenEntry>();

  async saveRefreshToken(
    hashedToken: string,
    email: string,
    ttlSeconds: number
  ): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.refreshTokens.set(hashedToken, {
      email,
      expiresAt,
    });
  }

  async deleteRefreshToken(hashedToken: string): Promise<void> {
    this.refreshTokens.delete(hashedToken);
  }

  async getRefreshTokenEmail(hashedToken: string): Promise<string | null> {
    const entry = this.refreshTokens.get(hashedToken);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.refreshTokens.delete(hashedToken);
      return null;
    }

    return entry.email;
  }
}