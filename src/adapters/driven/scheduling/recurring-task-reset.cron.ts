import cron from "node-cron";
import type { FastifyBaseLogger } from "fastify";
import type { ResetDueRecurringTasksUseCase } from "../../../domain/recurring-task/reset-due-recurring-tasks.use-case";

export function startRecurringTaskResetCron(
    resetDueRecurringTasksUseCase: ResetDueRecurringTasksUseCase,
    logger: FastifyBaseLogger,
): () => void {
    const enabled = process.env.RECURRING_TASK_RESET_CRON_ENABLED !== "false";
    const timezone = process.env.RECURRING_TASK_RESET_TZ ?? "Europe/Berlin";

    if (!enabled) {
        logger.info("Recurring task reset cron is disabled");
        return () => {};
    }

    const job = cron.schedule(
        "8 13 * * *",
        async () => {
            try {
                const result = await resetDueRecurringTasksUseCase.execute();
                logger.info(
                    {
                        resetTaskCount: result.resetTaskCount,
                        affectedEmails: result.affectedEmails,
                    },
                    "Recurring task midnight reset completed",
                );
            } catch (error) {
                logger.error(error, "Recurring task midnight reset failed");
            }
        },
        { timezone },
    );

    logger.info({ timezone }, "Recurring task reset cron scheduled for 00:00 daily");

    return () => job.stop();
}
