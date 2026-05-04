import jwt from "jsonwebtoken";

export function createTestAccessToken(
    email = "test@example.com",
    secret = process.env.JWT_SECRET!
) {
    return jwt.sign({ email }, secret, {
        algorithm: "HS256",
        expiresIn: "15m",
    });
}