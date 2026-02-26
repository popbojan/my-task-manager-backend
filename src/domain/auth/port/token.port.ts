export interface TokenPort {

    generateAccessToken(payload: { email: string }): string

}