import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { ensureUser } from "../../setup/user-prisma-helper.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("POST /recurring-tasks creates a recurring task for authenticated user", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Learning German",
            description: "Reading or writing for 30 minutes",
            frequency: "daily",
        },
    });

    assert.equal(response.statusCode, 201);

    const body = response.json();

    assert.equal(body.title, "Learning German");
    assert.equal(body.description, "Reading or writing for 30 minutes");
    assert.equal(body.status, "todo");
    assert.equal(body.frequency, "daily");
    assert.equal(body.streakCount, 0);
    assert.ok(body.id);
    assert.ok(body.nextResetAt);
    assert.ok(body.createdAt);
    assert.ok(body.updatedAt);

    const createdTask = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: body.id },
        include: { user: true },
    });

    assert.equal(createdTask.userId, user.id);
    assert.equal(createdTask.user.email, email);
    assert.equal(createdTask.title, "Learning German");
    assert.equal(createdTask.description, "Reading or writing for 30 minutes");
    assert.equal(createdTask.frequency, "daily");
});

test("POST /recurring-tasks creates a recurring task with default status", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Weekly review",
            frequency: "weekly",
        },
    });

    assert.equal(response.statusCode, 201);

    const body = response.json();

    assert.equal(body.title, "Weekly review");
    assert.equal(body.description, null);
    assert.equal(body.status, "todo");
    assert.equal(body.frequency, "weekly");
    assert.equal(body.streakCount, 0);
});

test("POST /recurring-tasks returns 400 when title is missing", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            frequency: "daily",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.equal(body.statusCode, 400);
    assert.match(body.message, /title/i);
});

test("POST /recurring-tasks returns 400 when frequency is missing", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Missing frequency task",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.equal(body.statusCode, 400);
    assert.match(body.message, /frequency/i);
});

test("POST /recurring-tasks returns 400 for invalid frequency", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Invalid frequency task",
            frequency: "INVALID_FREQUENCY",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.equal(body.statusCode, 400);
    assert.match(body.message, /frequency/i);
});

test("POST /recurring-tasks returns 401 when token is invalid", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/recurring-tasks",
        headers: {
            authorization: "Bearer invalid-token",
        },
        payload: {
            title: "Should not be created",
            frequency: "daily",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");

    const recurringTasks = await ctx.prisma.recurringTask.findMany();

    assert.equal(recurringTasks.length, 0);
});
