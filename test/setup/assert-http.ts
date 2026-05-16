import assert from "node:assert/strict";

export function assertBodyValidationFailed(
    body: { statusCode?: unknown; error?: unknown; message?: unknown },
    messageHint: RegExp,
): void {
    assert.equal(body.statusCode, 400);
    assert.equal(body.error, "Bad Request");
    assert.match(String(body.message), messageHint);
}
