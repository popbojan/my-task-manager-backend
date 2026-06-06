import "dotenv/config";
import { buildApp } from "./app.js";
import { startRecurringTaskResetCron } from "./adapters/driven/scheduling/recurring-task-reset.cron.js";

const { fastify, prisma, resetDueRecurringTasksUseCase } = await buildApp();
const stopRecurringTaskResetCron = startRecurringTaskResetCron(
    resetDueRecurringTasksUseCase,
    fastify.log,
);

// --- Start the App ---
try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    fastify.log.info(`Server is running on http://${host}:${port}`);
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}

// --- Shut Down the App ---
process.on("SIGINT", async () => {
    fastify.log.info("Shutting down...");
    stopRecurringTaskResetCron();
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
});
