import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { ensureUser } from "../../setup/user-prisma-helper.js";
import { createRecurringTaskForEmail } from "../../setup/recurring-task-prisma-helper.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("GET /recurring-tasks/:recurringTaskId returns an authenticated user's recurring task", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "My recurring task",
        description: "My description",
        frequency: "daily",
        status: "todo",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.id, recurringTask.id);
    assert.equal(body.title, "My recurring task");
    assert.equal(body.description, "My description");
    assert.equal(body.status, "todo");
    assert.equal(body.frequency, "daily");
    assert.equal(body.streakCount, 0);
    assert.ok(body.nextResetAt);
});

test("GET /recurring-tasks/:recurringTaskId returns 401 when token is invalid", async () => {
    const email = "test@example.com";

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Recurring task",
        description: "Description",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});

test("GET /recurring-tasks/:recurringTaskId returns 403 when recurring task belongs to another user", async () => {
    const ownerEmail = "owner@example.com";
    const otherUserEmail = "other@example.com";

    const otherUser = await ensureUser(ctx.prisma, otherUserEmail);
    const otherUserToken = createTestAccessToken(otherUser.id, otherUser.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, ownerEmail, {
        title: "Protected recurring task",
        description: "Should not be visible",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: `Bearer ${otherUserToken}`,
        },
    });

    assert.equal(response.statusCode, 403);

    const body = response.json();

    assert.equal(body.statusCode, 403);
    assert.equal(body.error, "Forbidden");
    assert.equal(body.message, "You are not allowed to access this recurring task");
});

test("GET /recurring-tasks/:recurringTaskId returns 404 when recurring task does not exist", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-tasks/non-existing-recurring-task-id",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 404);

    const body = response.json();

    assert.equal(body.statusCode, 404);
    assert.equal(body.error, "Not Found");
    assert.equal(body.message, "Recurring task not found");
});
