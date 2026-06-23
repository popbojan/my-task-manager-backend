import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { ensureUser } from "../../setup/user-prisma-helper.js";
import { createRecurringTaskForEmail } from "../../setup/recurring-task-prisma-helper.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("DELETE /recurring-tasks/:recurringTaskId deletes an authenticated user's recurring task", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Recurring task to delete",
        description: "Delete me",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 204);

    const deletedTask = await ctx.prisma.recurringTask.findUnique({
        where: { id: recurringTask.id },
    });

    assert.equal(deletedTask, null);
});

test("DELETE /recurring-tasks/:recurringTaskId returns 401 when token is invalid", async () => {
    const email = "test@example.com";

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Protected recurring task",
        description: "Description",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: `/recurring-tasks/${recurringTask.id}`,
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");

    const existingTask = await ctx.prisma.recurringTask.findUnique({
        where: { id: recurringTask.id },
    });

    assert.notEqual(existingTask, null);
});

test("DELETE /recurring-tasks/:recurringTaskId returns 403 when recurring task belongs to another user", async () => {
    const ownerEmail = "owner@example.com";
    const otherUserEmail = "other@example.com";

    const otherUser = await ensureUser(ctx.prisma, otherUserEmail);
    const otherUserToken = createTestAccessToken(otherUser.id, otherUser.email);

    const recurringTask = await createRecurringTaskForEmail(ctx.prisma, ownerEmail, {
        title: "Protected recurring task",
        description: "Should not be deleted",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "DELETE",
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

    const existingTask = await ctx.prisma.recurringTask.findUnique({
        where: { id: recurringTask.id },
        include: { user: true },
    });

    assert.notEqual(existingTask, null);
    assert.equal(existingTask?.user.email, ownerEmail);
});

test("DELETE /recurring-tasks/:recurringTaskId returns 204 when recurring task does not exist", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: "/recurring-tasks/non-existing-recurring-task-id",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 204);
});
