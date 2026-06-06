import test from "node:test";
import assert from "node:assert/strict";
import { ResolveAllTasksStreakActivity } from "../../../src/domain/recurring-task/activity/resolve-all-tasks-streak.activity.js";
import { AreAllDailyTasksDoneActivity } from "../../../src/domain/recurring-task/activity/are-all-daily-tasks-done.activity.js";
import { BuildRecurringTaskResetUpdateActivity } from "../../../src/domain/recurring-task/activity/build-recurring-task-reset-update.activity.js";
import { CalculateNextResetAtActivity } from "../../../src/domain/recurring-task/activity/calculate-next-reset-at.activity.js";
import type { RecurringTask } from "../../../src/domain/recurring-task/model/recurring-task.js";

const resolveAllTasksStreakActivity = new ResolveAllTasksStreakActivity();
const areAllDailyTasksDoneActivity = new AreAllDailyTasksDoneActivity();
const buildRecurringTaskResetUpdateActivity = new BuildRecurringTaskResetUpdateActivity(
    new CalculateNextResetAtActivity(),
);

test("ResolveAllTasksStreakActivity increments only when all daily tasks are done", () => {
    assert.equal(
        resolveAllTasksStreakActivity.execute(
            [{ status: "done" }, { status: "todo" }],
            3,
        ),
        0,
    );

    assert.equal(
        resolveAllTasksStreakActivity.execute(
            [{ status: "done" }, { status: "done" }],
            3,
        ),
        4,
    );
});

test("AreAllDailyTasksDoneActivity returns false for empty list", () => {
    assert.equal(areAllDailyTasksDoneActivity.execute([]), false);
});

test("BuildRecurringTaskResetUpdateActivity resets streak when task was not completed", () => {
    const task: RecurringTask = {
        id: "task-1",
        title: "Daily task",
        description: null,
        status: "in_progress",
        frequency: "daily",
        streakCount: 5,
        lastCompletedAt: null,
        lastResetAt: null,
        nextResetAt: new Date("2026-06-07T00:00:00.000Z"),
        email: "user@example.com",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-06T12:00:00.000Z"),
    };

    const asOf = new Date("2026-06-07T00:00:00.000Z");
    const update = buildRecurringTaskResetUpdateActivity.execute(task, asOf);

    assert.equal(update.status, "todo");
    assert.equal(update.streakCount, 0);
    assert.equal(update.lastResetAt, asOf);
});

test("BuildRecurringTaskResetUpdateActivity keeps streak when task was completed", () => {
    const task: RecurringTask = {
        id: "task-1",
        title: "Daily task",
        description: null,
        status: "done",
        frequency: "daily",
        streakCount: 5,
        lastCompletedAt: new Date("2026-06-06T20:00:00.000Z"),
        lastResetAt: null,
        nextResetAt: new Date("2026-06-07T00:00:00.000Z"),
        email: "user@example.com",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-06T20:00:00.000Z"),
    };

    const update = buildRecurringTaskResetUpdateActivity.execute(
        task,
        new Date("2026-06-07T00:00:00.000Z"),
    );

    assert.equal(update.status, "todo");
    assert.equal(update.streakCount, undefined);
});
