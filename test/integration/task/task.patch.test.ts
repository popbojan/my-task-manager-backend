import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";

const ctx = setupIntegrationTestContext();

test("PATCH /tasks/:taskId updates an authenticated user's task", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const task = await ctx.prisma.task.create({
        data: {
            email,
            title: "Old task title",
            description: "Old description",
            status: "todo",
            priority: "none",
            deadline: new Date("2026-05-10T00:00:00.000Z"),
        },
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
    assert.equal(body.email, email);
    assert.equal(body.title, "Updated task title");
    assert.equal(body.description, "Old description");
    assert.equal(body.status, "in_progress");
    assert.equal(body.priority, "important_urgent");
    assert.equal(body.deadline, "2026-05-20T00:00:00.000Z");
});