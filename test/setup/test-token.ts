import jwt from "jsonwebtoken";

export function createTestAccessToken(
    userId?: string,
    email = "test@example.com",
    secret = process.env.JWT_SECRET!,
) {
    return jwt.sign(
        {
            sub: userId,
            email,
        },
        secret,
        {
            algorithm: "HS256",
            expiresIn: "15m",
        },
    );
}
