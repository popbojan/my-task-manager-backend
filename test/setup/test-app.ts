import { buildApp } from "../../src/app.js";

export async function buildTestApp() {
    const { fastify, prisma } = await buildApp();

    await prisma.task.deleteMany();

    return { fastify, prisma };
}