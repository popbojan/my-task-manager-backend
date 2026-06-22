import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("POST /tasks creates a task for authenticated user", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Create integration test",
            description: "Test create task endpoint",
            status: "todo",
            priority: "important",
            deadline: "2026-05-20T00:00:00.000Z",
        },
    });

    assert.equal(response.statusCode, 201);

    const body = response.json();

    assert.equal(body.title, "Create integration test");
    assert.equal(body.description, "Test create task endpoint");
    assert.equal(body.status, "todo");
    assert.equal(body.priority, "important");
    assert.equal(body.deadline, "2026-05-20T00:00:00.000Z");
    assert.ok(body.id);
    assert.ok(body.createdAt);
    assert.ok(body.updatedAt);

    const createdTask = await ctx.prisma.task.findUniqueOrThrow({
        where: { id: body.id },
        include: { user: true },
    });

    assert.equal(createdTask.user.email, email);
    assert.equal(createdTask.title, "Create integration test");
    assert.equal(createdTask.description, "Test create task endpoint");
    assert.equal(createdTask.status, "todo");
    assert.equal(createdTask.priority, "important");
});

test("POST /tasks creates a task with default status and priority", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Minimal task",
        },
    });

    assert.equal(response.statusCode, 201);

    const body = response.json();

    assert.equal(body.title, "Minimal task");
    assert.equal(body.description, null);
    assert.equal(body.status, "todo");
    assert.equal(body.priority, "none");
    assert.equal(body.deadline, null);
});

test("POST /tasks returns 400 when title is missing", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            status: "todo",
            priority: "important",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.equal(body.statusCode, 400);
    assert.match(body.message, /title/i);
});

test("POST /tasks returns 400 for invalid status", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Invalid status task",
            status: "INVALID_STATUS",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.equal(body.statusCode, 400);
    assert.match(body.message, /status/i);
});

test("POST /tasks returns 400 for invalid priority", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            title: "Invalid priority task",
            priority: "INVALID_PRIORITY",
        },
    });

    assert.equal(response.statusCode, 400);

    const body = response.json();

    assert.equal(body.statusCode, 400);
    assert.match(body.message, /priority/i);
});

test("POST /tasks returns 401 when token is invalid", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/tasks",
        headers: {
            authorization: "Bearer invalid-token",
        },
        payload: {
            title: "Should not be created",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");

    const tasks = await ctx.prisma.task.findMany();

    assert.equal(tasks.length, 0);
});
