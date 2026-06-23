import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { ensureUser } from "../../setup/user-prisma-helper.js";
import { createRecurringTaskForEmail } from "../../setup/recurring-task-prisma-helper.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("PATCH /recurring-tasks/:recurringTaskId updates an authenticated user's recurring task", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Old recurring task title",
        description: "Old description",
        frequency: "daily",
        status: "todo",
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Updated recurring task title",
            status: "in_progress",
            frequency: "weekly",
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.id, recurringTask.id);
    assert.equal(body.title, "Updated recurring task title");
    assert.equal(body.description, "Old description");
    assert.equal(body.status, "in_progress");
    assert.equal(body.frequency, "weekly");

    const updatedTask = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: recurringTask.id },
    });

    assert.equal(updatedTask.title, "Updated recurring task title");
    assert.equal(updatedTask.status, "in_progress");
    assert.equal(updatedTask.frequency, "weekly");
    assert.equal(updatedTask.description, "Old description");
});

test("PATCH /recurring-tasks/:recurringTaskId returns 400 for invalid status", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Recurring task",
        description: "Description",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "INVALID_STATUS",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.match(body.message, /status/i);
});

test("PATCH /recurring-tasks/:recurringTaskId returns 401 when token is invalid", async () => {
    const email = "test@example.com";

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Recurring task",
        description: "Description",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: "Bearer invalid-token",
        },
        payload: {
            title: "Updated title",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});

test("PATCH /recurring-tasks/:recurringTaskId returns 403 when recurring task belongs to another user", async () => {
    const ownerEmail = "owner@example.com";
    const otherUserEmail = "other@example.com";

    const otherUser = await ensureUser(ctx.prisma, otherUserEmail);
    const otherUserToken = createTestAccessToken(otherUser.id, otherUser.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, ownerEmail, {
        title: "Protected recurring task",
        description: "Should not be editable",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: `Bearer ${otherUserToken}`,
        },
        payload: {
            title: "Hijacked recurring task",
        },
    });

    assert.equal(response.statusCode, 403);

    const body = response.json();

    assert.equal(body.statusCode, 403);
    assert.equal(body.error, "Forbidden");
    assert.equal(body.message, "You are not allowed to access this recurring task");

    const unchangedTask = await ctx.prisma.recurringTask.findUniqueOrThrow({
        where: { id: recurringTask.id },
        include: { user: true },
    });

    assert.equal(unchangedTask.title, "Protected recurring task");
    assert.equal(unchangedTask.user.email, ownerEmail);
});

test("PATCH /recurring-tasks/:recurringTaskId returns 404 when recurring task does not exist", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: "/recurring-tasks/non-existing-recurring-task-id",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Updated title",
        },
    });

    assert.equal(response.statusCode, 404);

    const body = response.json();

    assert.equal(body.statusCode, 404);
    assert.equal(body.error, "Not Found");
    assert.equal(body.message, "Recurring task not found");
});
