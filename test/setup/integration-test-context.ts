import { before, after, beforeEach } from "node:test";
import { buildApp } from "../../src/app.js";
import { startTestDatabase } from "./test-database.js";

let context: Awaited<ReturnType<typeof buildApp>>;
let stopDatabase: () => Promise<void>;

export function setupIntegrationTestContext() {
    before(async () => {
        const db = await startTestDatabase();
        stopDatabase = db.stop;

        context = await buildApp();
    });

    beforeEach(async () => {
        await context.prisma.$transaction([
            context.prisma.task.deleteMany(),
        ]);
    });

    after(async () => {
        await context.fastify.close();
        await context.prisma.$disconnect();
        await stopDatabase();
    });

    return {
        get fastify() {
            return context.fastify;
        },
        get prisma() {
            return context.prisma;
        },
    };
}