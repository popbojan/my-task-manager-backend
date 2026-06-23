import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import { createTaskForEmail } from "../../setup/task-prisma-helper.js";
import { ensureUser } from "../../setup/user-prisma-helper.js";

const ctx = setupIntegrationTestContext();

test("GET /tasks returns authenticated user's tasks", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const task1 = await createTaskForEmail(ctx.prisma, email, {
        title: "First task",
        description: "First description",
        status: "todo",
        priority: "none",
    });

    const task2 = await createTaskForEmail(ctx.prisma, email, {
        title: "Second task",
        description: "Second description",
        status: "in_progress",
        priority: "important",
    });

    await createTaskForEmail(ctx.prisma, "other@example.com", {
        title: "Other user's task",
        description: "Should not be returned",
        status: "todo",
        priority: "urgent",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.length, 2);

    const ids = body.map((task: { id: string }) => task.id);

    assert.ok(ids.includes(task1.id));
    assert.ok(ids.includes(task2.id));
    assert.ok(!ids.includes("Other user's task"));
});

test("GET /tasks returns empty array when authenticated user has no tasks", async () => {
    const email = "empty@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    await createTaskForEmail(ctx.prisma, "other@example.com", {
        title: "Other user's task",
        description: "Should not be returned",
        status: "todo",
        priority: "none",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.deepEqual(body, []);
});

test("GET /tasks returns 401 when token is invalid", async () => {
    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/tasks",
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});
