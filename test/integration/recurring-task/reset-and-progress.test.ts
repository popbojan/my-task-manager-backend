import test from "node:test";
import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import { PrismaRecurringTaskAdapter } from "../../../src/adapters/driven/persistence/prisma-recurring-task.adapter.js";
import { ResolveAllTasksStreakActivity } from "../../../src/domain/recurring-task/activity/resolve-all-tasks-streak.activity.js";
import { ResetDueRecurringTasksActivity } from "../../../src/domain/recurring-task/activity/reset-due-recurring-tasks.activity.js";
import { AreAllDailyTasksDoneActivity } from "../../../src/domain/recurring-task/activity/are-all-daily-tasks-done.activity.js";
import { BuildRecurringTaskResetUpdateActivity } from "../../../src/domain/recurring-task/activity/build-recurring-task-reset-update.activity.js";
import { BuildRecurringTaskProgressUpdatesActivity } from "../../../src/domain/recurring-task/activity/build-recurring-task-progress-updates.activity.js";
import { FindDueRecurringTasksActivity } from "../../../src/domain/recurring-task/activity/find-due-recurring-tasks.activity.js";
import { CalculateNextResetAtActivity } from "../../../src/domain/recurring-task/activity/calculate-next-reset-at.activity.js";
import { ResetDueRecurringTasksUseCase } from "../../../src/domain/recurring-task/reset-due-recurring-tasks.use-case.js";

const ctx = setupIntegrationTestContext();

function createResetDueRecurringTasksUseCase(prisma: PrismaClient) {
    const adapter = new PrismaRecurringTaskAdapter(
        prisma,
        new ResolveAllTasksStreakActivity(),
    );
    const calculateNextResetAtActivity = new CalculateNextResetAtActivity();
    const areAllDailyTasksDoneActivity = new AreAllDailyTasksDoneActivity();

    return new ResetDueRecurringTasksUseCase(
        new FindDueRecurringTasksActivity(adapter),
        new BuildRecurringTaskResetUpdateActivity(calculateNextResetAtActivity),
        new BuildRecurringTaskProgressUpdatesActivity(adapter, areAllDailyTasksDoneActivity),
        new ResetDueRecurringTasksActivity(adapter),
    );
}

async function createRecurringTask(
    token: string,
    payload: { title: string; frequency: "daily" | "weekly" | "monthly" },
) {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload,
    });

    assert.equal(response.statusCode, 201);
    return response.json() as { id: string; streakCount: number; status: string };
}

async function updateRecurringTask(
    token: string,
    recurringTaskId: string,
    payload: { status?: "todo" | "in_progress" | "done" },
) {
    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${recurringTaskId}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload,
    });

    assert.equal(response.statusCode, 200);
    return response.json();
}

async function getProgress(token: string) {
    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-task-progress",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);
    return response.json() as { allTasksStreak: number };
}

test("midnight reset increments progress when all daily tasks were completed before reset", async () => {
    const email = "progress-user@example.com";
    const token = createTestAccessToken(email);
    const resetUseCase = createResetDueRecurringTasksUseCase(ctx.prisma);

    const first = await createRecurringTask(token, {
        title: "Daily one",
        frequency: "daily",
    });
    const second = await createRecurringTask(token, {
        title: "Daily two",
        frequency: "daily",
    });

    await updateRecurringTask(token, first.id, { status: "done" });
    await updateRecurringTask(token, second.id, { status: "done" });

    assert.equal((await getProgress(token)).allTasksStreak, 0);

    const asOf = new Date("2026-06-08T00:00:00.000Z");

    await ctx.prisma.recurringTask.updateMany({
        data: { nextResetAt: asOf },
    });

    await resetUseCase.execute(asOf);

    assert.equal((await getProgress(token)).allTasksStreak, 1);
});

test("midnight reset moves due tasks back to todo and clears missed streaks", async () => {
    const email = "reset-user@example.com";
    const token = createTestAccessToken(email);
    const resetUseCase = createResetDueRecurringTasksUseCase(ctx.prisma);

    const completed = await createRecurringTask(token, {
        title: "Completed daily",
        frequency: "daily",
    });
    const missed = await createRecurringTask(token, {
        title: "Missed daily",
        frequency: "daily",
    });

    await updateRecurringTask(token, completed.id, { status: "done" });

    await ctx.prisma.recurringTask.update({
        where: { id: missed.id },
        data: { streakCount: 4, status: "in_progress" },
    });

    const asOf = new Date("2026-06-08T00:00:00.000Z");

    await ctx.prisma.recurringTask.updateMany({
        data: { nextResetAt: asOf },
    });

    const result = await resetUseCase.execute(asOf);

    assert.equal(result.resetTaskCount, 2);

    const completedAfterReset = await ctx.prisma.recurringTask.findUnique({
        where: { id: completed.id },
    });
    const missedAfterReset = await ctx.prisma.recurringTask.findUnique({
        where: { id: missed.id },
    });

    assert.equal(completedAfterReset?.status, "todo");
    assert.equal(completedAfterReset?.streakCount, 1);
    assert.equal(missedAfterReset?.status, "todo");
    assert.equal(missedAfterReset?.streakCount, 0);

    const progress = await ctx.prisma.recurringTaskProgress.findUnique({
        where: { email },
    });

    assert.equal(progress?.allTasksStreak, 0);
});
