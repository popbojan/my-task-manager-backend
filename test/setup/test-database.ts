import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execFileSync } from "node:child_process";

export async function startTestDatabase() {
    const container = await new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("taskmgr_test")
        .withUsername("taskmgr")
        .withPassword("taskmgr")
        .start();

    const databaseUrl = container.getConnectionUri();

    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = "test-secret";
    process.env.OTP_SECRET = "test-otp-secret";

    execFileSync("npx", ["prisma", "migrate", "deploy"], {
        stdio: "inherit",
        env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
        },
    });


    return {
        stop: async () => {
            await container.stop();
        },
    };
}