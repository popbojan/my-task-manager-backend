import type { PrismaClient } from "@prisma/client";
import { DEFAULT_TEST_LANGUAGE } from "./test-auth-payload.js";

type TestLanguage = "en" | "de" | "sr";

export async function ensureUser(
    prisma: PrismaClient,
    email: string,
    language: TestLanguage = DEFAULT_TEST_LANGUAGE,
) {
    return prisma.user.upsert({
        where: { email },
        create: { email, language },
        update: { language },
    });
}
