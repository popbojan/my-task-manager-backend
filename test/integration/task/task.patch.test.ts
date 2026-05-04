import test from "node:test";
import assert from "node:assert/strict";
import {createTestAccessToken} from "../../setup/test-token";
import {buildTestApp} from "../../setup/test-app";

test("PATCH /tasks/:taskId updates an authenticated user's task", async () => {
    const email = "test@example.com";
    const token = createTestAccessToken(email);

    const { fastify, prisma } = await buildTestApp();

    await prisma.task.deleteMany({
        where: { email },
    });

    const task = await prisma.task.create({
        data: {
            email,
            title: "Old task title",
            description: "Old description",
            status: "todo",
            priority: "none",
            deadline: new Date("2026-05-10T00:00:00.000Z"),
        },
    });

    const response = await fastify.inject({
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

    const updatedTask = await prisma.task.findUniqueOrThrow({
        where: { id: task.id },
    });

    assert.equal(updatedTask.title, "Updated task title");
    assert.equal(updatedTask.status, "in_progress");
    assert.equal(updatedTask.priority, "important_urgent");

    await prisma.task.deleteMany({
        where: { email },
    });

    await fastify.close();
    await prisma.$disconnect();
});