import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { ensureUser } from "../../setup/user-prisma-helper.js";
import { createRecurringTaskForEmail } from "../../setup/recurring-task-prisma-helper.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("GET /recurring-tasks returns authenticated user's recurring tasks", async () => {
    const email = "test@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    const recurringTask1 = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "First recurring task",
        description: "First description",
        frequency: "daily",
    });

    const recurringTask2 = await createRecurringTaskForEmail(ctx.prisma, email, {
        title: "Second recurring task",
        description: "Second description",
        frequency: "weekly",
        status: "in_progress",
    });

    await createRecurringTaskForEmail(ctx.prisma, "other@example.com", {
        title: "Other user's recurring task",
        description: "Should not be returned",
        frequency: "monthly",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.length, 2);

    const ids = body.map((recurringTask: { id: string }) => recurringTask.id);

    assert.ok(ids.includes(recurringTask1.id));
    assert.ok(ids.includes(recurringTask2.id));
});

test("GET /recurring-tasks returns empty array when authenticated user has no recurring tasks", async () => {
    const email = "empty@example.com";
    const user = await ensureUser(ctx.prisma, email);
    const token = createTestAccessToken(user.id, user.email);

    await createRecurringTaskForEmail(ctx.prisma, "other@example.com", {
        title: "Other user's recurring task",
        description: "Should not be returned",
        frequency: "daily",
    });

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-tasks",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.deepEqual(body, []);
});

test("GET /recurring-tasks returns 401 when token is invalid", async () => {
    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/recurring-tasks",
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});
