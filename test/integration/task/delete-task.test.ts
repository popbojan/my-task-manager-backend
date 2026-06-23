import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import { createTaskForEmail } from "../../setup/task-prisma-helper.js";

const ctx = setupIntegrationTestContext();

test("DELETE /tasks/:taskId deletes an authenticated user's task", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "Task to delete",
        description: "Delete me",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 204);

    const deletedTask = await ctx.prisma.task.findUnique({
        where: { id: task.id },
    });

    assert.equal(deletedTask, null);
});

test("DELETE /tasks/:taskId returns 401 when token is invalid", async () => {
    const email = "test@example.com";

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "Protected task",
        description: "Description",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");

    const existingTask = await ctx.prisma.task.findUnique({
        where: { id: task.id },
    });

    assert.notEqual(existingTask, null);
});

test("DELETE /tasks/:taskId returns 403 when task belongs to another user", async () => {
    const ownerEmail = "owner@example.com";
    const otherUserEmail = "other@example.com";

    const otherUserToken = createTestAccessToken(otherUserEmail);

    const task = await createTaskForEmail(ctx.prisma, ownerEmail, {
        title: "Protected task",
        description: "Should not be deleted",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: `Bearer ${otherUserToken}`,
        },
    });

    assert.equal(response.statusCode, 403);

    const body = response.json();

    assert.equal(body.statusCode, 403);
    assert.equal(body.error, "Forbidden");
    assert.equal(body.message, "You are not allowed to access this task");

    const existingTask = await ctx.prisma.task.findUnique({
        where: { id: task.id },
        include: { user: true },
    });

    assert.notEqual(existingTask, null);
    assert.equal(existingTask?.user.email, ownerEmail);
});

test("DELETE /tasks/:taskId returns 204 when task does not exist", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "DELETE",
        url: "/tasks/non-existing-task-id",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 204);
});
