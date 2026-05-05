import { buildApp } from "../../src/app.js";
import { startTestDatabase } from "./test-database.js";

export async function buildTestApp() {
    const db = await startTestDatabase();

    const { fastify, prisma } = await buildApp();

    await prisma.task.deleteMany();

    return {
        fastify,
        prisma,
        stop: async () => {
            await fastify.close();
            await prisma.$disconnect();
            await db.stop();
        },
    };
}