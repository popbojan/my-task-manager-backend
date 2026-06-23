import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import { createTaskForEmail } from "../../setup/task-prisma-helper.js";

const ctx = setupIntegrationTestContext();

test("GET /tasks/:taskId returns an authenticated user's task", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "My task",
        description: "My description",
        status: "todo",
        priority: "none",
        deadline: new Date("2026-05-10T00:00:00.000Z"),
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.id, task.id);
    assert.equal(body.title, "My task");
    assert.equal(body.description, "My description");
    assert.equal(body.status, "todo");
    assert.equal(body.priority, "none");
    assert.equal(body.deadline, "2026-05-10T00:00:00.000Z");
});

test("GET /tasks/:taskId returns 401 when token is invalid", async () => {
    const email = "test@example.com";

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "Task",
        description: "Description",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});

test("GET /tasks/:taskId returns 403 when task belongs to another user", async () => {
    const ownerEmail = "owner@example.com";
    const otherUserEmail = "other@example.com";

    const otherUserToken = createTestAccessToken(otherUserEmail);

    const task = await createTaskForEmail(ctx.prisma, ownerEmail, {
        title: "Protected task",
        description: "Should not be visible",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
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
});

test("GET /tasks/:taskId returns 404 when task does not exist", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/tasks/non-existing-task-id",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 404);

    const body = response.json();

    assert.equal(body.statusCode, 404);
    assert.equal(body.error, "Not Found");
    assert.equal(body.message, "Task not found");
});
