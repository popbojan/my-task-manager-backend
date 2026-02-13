import jwt from "jsonwebtoken";

export class GenerateTokenActivity {
    private readonly JWT_SECRET: string;
    private readonly JWT_EXPIRES_IN = "60m";

    constructor() {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        this.JWT_SECRET = process.env.JWT_SECRET;
    }

    execute(email: string): string {
        return jwt.sign(
            { email },
            this.JWT_SECRET,
            {
                expiresIn: this.JWT_EXPIRES_IN,
                algorithm: "HS256",
            }
        );
    }
}
