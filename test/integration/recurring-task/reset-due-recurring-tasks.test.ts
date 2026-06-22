import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import {
    createProgressForEmail,
    findProgressByEmail,
    updateRecurringTasksNextResetAtForEmail,
} from "../../setup/test-database-helpers.js";
import { CalculateNextResetAtActivity } from "../../../src/domain/recurring-task/activity/calculate-next-reset-at.activity.js";

const BERLIN_TIMEZONE = "Europe/Berlin";
const calculateNextResetAtActivity = new CalculateNextResetAtActivity();

const ctx = setupIntegrationTestContext();

function getBerlinTime(from: Date = new Date()): Date {
    return new Date(
        from.toLocaleString("en-US", {
            timeZone: BERLIN_TIMEZONE,
        }),
    );
}

function getNextDailyResetAt(from: Date): Date {
    return calculateNextResetAtActivity.execute("daily", from);
}

test("ResetDueRecurringTasksUseCase resets due recurring tasks back to todo", async () => {
    const email = "reset-user@example.com";
    const token = createTestAccessToken(email);
    const resetAt = getBerlinTime();

    const createResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Daily reset task",
            frequency: "daily",
        },
    });

    assert.equal(createResponse.statusCode, 201);

    const createdTask = createResponse.json();

    await ctx.prisma.recurringTask.update({
        where: { id: createdTask.id },
        data: {
            nextResetAt: resetAt,
            status: "in_progress",
            streakCount: 3,
        },
    });

    const result = await ctx.resetDueRecurringTasksUseCase.execute();

    assert.equal(result.resetTaskCount, 1);
    assert.deepEqual(result.affectedEmails, [email]);

    const taskAfterReset = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: createdTask.id },
    });

    assert.equal(taskAfterReset.status, "todo");
    assert.equal(taskAfterReset.streakCount, 0);
    assert.ok(taskAfterReset.lastResetAt);
    assert.equal(
        taskAfterReset.nextResetAt?.toISOString(),
        getNextDailyResetAt(taskAfterReset.lastResetAt!).toISOString(),
    );
});

test("ResetDueRecurringTasksUseCase resets in_progress recurring tasks from Bearbeitung back to todo", async () => {
    const email = "in-progress-user@example.com";
    const token = createTestAccessToken(email);
    const resetAt = getBerlinTime();

    const createResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Task in Bearbeitung",
            frequency: "daily",
        },
    });

    assert.equal(createResponse.statusCode, 201);

    const createdTask = createResponse.json();

    const updateResponse = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${createdTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "in_progress",
        },
    });

    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.json().status, "in_progress");

    await ctx.prisma.recurringTask.update({
        where: { id: createdTask.id },
        data: { nextResetAt: resetAt },
    });

    const result = await ctx.resetDueRecurringTasksUseCase.execute();

    assert.equal(result.resetTaskCount, 1);
    assert.deepEqual(result.affectedEmails, [email]);

    const taskAfterReset = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: createdTask.id },
    });

    assert.equal(taskAfterReset.status, "todo");
    assert.equal(taskAfterReset.streakCount, 0);
    assert.ok(taskAfterReset.lastResetAt);
});

test("ResetDueRecurringTasksUseCase keeps streak when due task was completed before reset", async () => {
    const email = "completed-user@example.com";
    const token = createTestAccessToken(email);
    const resetAt = getBerlinTime();

    const createResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Completed daily task",
            frequency: "daily",
        },
    });

    assert.equal(createResponse.statusCode, 201);

    const createdTask = createResponse.json();

    const updateResponse = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${createdTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "done",
        },
    });

    assert.equal(updateResponse.statusCode, 200);

    await ctx.prisma.recurringTask.update({
        where: { id: createdTask.id },
        data: { nextResetAt: resetAt },
    });

    await ctx.resetDueRecurringTasksUseCase.execute();

    const taskAfterReset = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: createdTask.id },
    });

    assert.equal(taskAfterReset.status, "todo");
    assert.equal(taskAfterReset.streakCount, 1);
});

test("ResetDueRecurringTasksUseCase does not reset tasks that are not yet due", async () => {
    const email = "not-due-user@example.com";
    const token = createTestAccessToken(email);
    const resetAt = getBerlinTime();
    const nextResetAt = getNextDailyResetAt(resetAt);

    const createResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Future reset task",
            frequency: "daily",
        },
    });

    assert.equal(createResponse.statusCode, 201);

    const createdTask = createResponse.json();

    await ctx.prisma.recurringTask.update({
        where: { id: createdTask.id },
        data: {
            status: "in_progress",
            streakCount: 2,
            nextResetAt,
        },
    });

    const result = await ctx.resetDueRecurringTasksUseCase.execute();

    assert.equal(result.resetTaskCount, 0);
    assert.deepEqual(result.affectedEmails, []);

    const taskAfterReset = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: createdTask.id },
    });

    assert.equal(taskAfterReset.status, "in_progress");
    assert.equal(taskAfterReset.streakCount, 2);
});

test("ResetDueRecurringTasksUseCase increments progress when all daily tasks were completed before reset", async () => {
    const email = "progress-user@example.com";
    const token = createTestAccessToken(email);
    const resetAt = getBerlinTime();

    const firstCreateResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Daily one",
            frequency: "daily",
        },
    });

    assert.equal(firstCreateResponse.statusCode, 201);

    const firstTask = firstCreateResponse.json();

    const secondCreateResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Daily two",
            frequency: "daily",
        },
    });

    assert.equal(secondCreateResponse.statusCode, 201);

    const secondTask = secondCreateResponse.json();

    const firstUpdateResponse = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${firstTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "done",
        },
    });

    assert.equal(firstUpdateResponse.statusCode, 200);

    const secondUpdateResponse = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${secondTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "done",
        },
    });

    assert.equal(secondUpdateResponse.statusCode, 200);

    let progressResponse = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-task-progress",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(progressResponse.statusCode, 200);
    assert.equal(progressResponse.json().allTasksStreak, 0);

    await updateRecurringTasksNextResetAtForEmail(ctx.prisma, email, resetAt);

    await ctx.resetDueRecurringTasksUseCase.execute();

    progressResponse = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-task-progress",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(progressResponse.statusCode, 200);
    assert.equal(progressResponse.json().allTasksStreak, 1);

    const progress = await findProgressByEmail(ctx.prisma, email);

    assert.ok(progress);
    assert.equal(progress.allTasksStreak, 1);
    assert.ok(progress.lastCheckedAt);
});

test("ResetDueRecurringTasksUseCase clears progress streak when not all daily tasks were completed", async () => {
    const email = "missed-progress-user@example.com";
    const token = createTestAccessToken(email);
    const resetAt = getBerlinTime();

    const completedCreateResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Completed daily",
            frequency: "daily",
        },
    });

    assert.equal(completedCreateResponse.statusCode, 201);

    const completedTask = completedCreateResponse.json();

    const missedCreateResponse = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Missed daily",
            frequency: "daily",
        },
    });

    assert.equal(missedCreateResponse.statusCode, 201);

    const missedTask = missedCreateResponse.json();

    const updateResponse = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${completedTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "done",
        },
    });

    assert.equal(updateResponse.statusCode, 200);

    await ctx.prisma.recurringTask.update({
        where: { id: missedTask.id },
        data: {
            status: "in_progress",
            streakCount: 4,
        },
    });

    await createProgressForEmail(ctx.prisma, email, { allTasksStreak: 5 });

    await updateRecurringTasksNextResetAtForEmail(ctx.prisma, email, resetAt);

    const result = await ctx.resetDueRecurringTasksUseCase.execute();

    assert.equal(result.resetTaskCount, 2);
    assert.deepEqual(result.affectedEmails, [email]);

    const completedAfterReset = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: completedTask.id },
    });
    const missedAfterReset = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: missedTask.id },
    });

    assert.equal(completedAfterReset.status, "todo");
    assert.equal(completedAfterReset.streakCount, 1);
    assert.equal(missedAfterReset.status, "todo");
    assert.equal(missedAfterReset.streakCount, 0);

    const progress = await findProgressByEmail(ctx.prisma, email);

    assert.ok(progress);
    assert.equal(progress.allTasksStreak, 0);
    assert.ok(progress.lastCheckedAt);
});
