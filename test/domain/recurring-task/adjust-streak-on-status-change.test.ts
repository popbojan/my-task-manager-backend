import test from "node:test";
import assert from "node:assert/strict";
import { AdjustStreakOnStatusChangeActivity } from "../../../src/domain/recurring-task/activity/adjust-streak-on-status-change.activity.js";

const activity = new AdjustStreakOnStatusChangeActivity();

test("AdjustStreakOnStatusChangeActivity increments when newly marked as done", () => {
    assert.equal(activity.execute("in_progress", "done", 4), 5);
});

test("AdjustStreakOnStatusChangeActivity decrements when moved back from done", () => {
    assert.equal(activity.execute("done", "in_progress", 4), 3);
    assert.equal(activity.execute("done", "todo", 1), 0);
    assert.equal(activity.execute("done", "todo", 0), 0);
});

test("AdjustStreakOnStatusChangeActivity ignores unchanged or unrelated status updates", () => {
    assert.equal(activity.execute("done", "done", 4), undefined);
    assert.equal(activity.execute("todo", "in_progress", 4), undefined);
    assert.equal(activity.execute("in_progress", undefined, 4), undefined);
});
