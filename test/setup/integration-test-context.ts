import { before, after, beforeEach } from "node:test";
import { buildApp } from "../../src/app.js";
import { startTestDatabase } from "./test-database.js";
import { StubMailAdapter } from "./stub-mail.adapter.js";

let context: Awaited<ReturnType<typeof buildApp>>;
let stopDatabase: () => Promise<void>;

export function setupIntegrationTestContext() {
    before(async () => {
        process.env.RECURRING_TASK_RESET_TZ ??= "Europe/Berlin";

        const db = await startTestDatabase();
        stopDatabase = db.stop;

        context = await buildApp({ mailPort: new StubMailAdapter() });
    });

    beforeEach(async () => {
        await context.prisma.$transaction([
            context.prisma.recurringTaskProgress.deleteMany(),
            context.prisma.recurringTask.deleteMany(),
            context.prisma.task.deleteMany(),
            context.prisma.user.deleteMany(),
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
        get resetDueRecurringTasksUseCase() {
            return context.resetDueRecurringTasksUseCase;
        },
    };
}
