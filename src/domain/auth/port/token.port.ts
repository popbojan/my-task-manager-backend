export interface TokenPort {

    generateAccessToken(payload: { email: string }): string

    verifyAccessToken(token: string): { email: string };

}