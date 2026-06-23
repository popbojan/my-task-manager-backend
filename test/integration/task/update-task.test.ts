import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import { createTaskForEmail } from "../../setup/task-prisma-helper.js";

const ctx = setupIntegrationTestContext();

test("PATCH /tasks/:taskId updates an authenticated user's task", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "Old task title",
        description: "Old description",
        status: "todo",
        priority: "none",
        deadline: new Date("2026-05-10T00:00:00.000Z"),
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Updated task title",
            status: "in_progress",
            priority: "important_urgent",
            deadline: "2026-05-20T00:00:00.000Z",
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.id, task.id);
    assert.equal(body.title, "Updated task title");
    assert.equal(body.description, "Old description");
    assert.equal(body.status, "in_progress");
    assert.equal(body.priority, "important_urgent");
    assert.equal(body.deadline, "2026-05-20T00:00:00.000Z");

    const updatedTask = await ctx.prisma.task.findUniqueOrThrow({
        where: { id: task.id },
    });

    assert.equal(updatedTask.title, "Updated task title");
    assert.equal(updatedTask.status, "in_progress");
    assert.equal(updatedTask.priority, "important_urgent");
    assert.equal(updatedTask.description, "Old description");
});

test("PATCH /tasks/:taskId returns 400 for invalid status", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "Task",
        description: "Description",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
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

test("PATCH /tasks/:taskId returns 401 when token is invalid", async () => {
    const email = "test@example.com";

    const task = await createTaskForEmail(ctx.prisma, email, {
        title: "Task",
        description: "Description",
        status: "todo",
        priority: "none",
        deadline: new Date("2026-05-10T00:00:00.000Z"),
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
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

test("PATCH /tasks/:taskId returns 403 when task belongs to another user", async () => {
    const ownerEmail = "owner@example.com";
    const otherUserEmail = "other@example.com";

    const otherUserToken = createTestAccessToken(otherUserEmail);

    const task = await createTaskForEmail(ctx.prisma, ownerEmail, {
        title: "Protected task",
        description: "Should not be editable",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        headers: {
            authorization: `Bearer ${otherUserToken}`,
        },
        payload: {
            title: "Hijacked task",
        },
    });

    assert.equal(response.statusCode, 403);

    const body = response.json();

    assert.equal(body.statusCode, 403);
    assert.equal(body.error, "Forbidden");
    assert.equal(body.message, "You are not allowed to access this task");

    const unchangedTask = await ctx.prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        include: { user: true },
    });

    assert.equal(unchangedTask.title, "Protected task");
    assert.equal(unchangedTask.user.email, ownerEmail);
});
