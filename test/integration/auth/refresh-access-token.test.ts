import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { computeTestOtp } from "../../setup/test-otp.js";
import { getSetCookieValue } from "../../setup/set-cookie.js";
import { loginRequestPayload } from "../../setup/test-auth-payload.js";

const ctx = setupIntegrationTestContext();

async function loginAndGetRefreshCookie(email: string): Promise<string> {
    const otp = computeTestOtp(email);
    const loginRes = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: loginRequestPayload(email, otp),
    });
    assert.equal(loginRes.statusCode, 200);

    const refresh = getSetCookieValue(loginRes.headers["set-cookie"], "refreshToken");
    assert.ok(refresh);

    return refresh!;
}

test("POST /auth/refresh returns 401 without refresh cookie", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/refresh",
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
    assert.match(body.message, /missing/i);
});

test("POST /auth/refresh returns 401 for invalid refresh token", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/refresh",
        headers: {
            cookie: "refreshToken=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});

test("POST /auth/refresh returns new access token and rotates refresh cookie", async () => {
    const email = "refresh-user@example.com";
    const oldRefresh = await loginAndGetRefreshCookie(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/refresh",
        headers: {
            cookie: `refreshToken=${oldRefresh}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    const decoded = jwt.verify(body.accessToken, process.env.JWT_SECRET!, {
        algorithms: ["HS256"],
    }) as { email?: string };

    assert.equal(decoded.email, email);

    const newRefresh = getSetCookieValue(response.headers["set-cookie"], "refreshToken");
    assert.ok(newRefresh);
    assert.notEqual(newRefresh, oldRefresh);
});

test("POST /auth/refresh returns 401 when reuse rotated refresh token", async () => {
    const email = "refresh-rotate@example.com";
    const oldRefresh = await loginAndGetRefreshCookie(email);

    const first = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/refresh",
        headers: {
            cookie: `refreshToken=${oldRefresh}`,
        },
    });

    assert.equal(first.statusCode, 200);

    const replay = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/refresh",
        headers: {
            cookie: `refreshToken=${oldRefresh}`,
        },
    });

    assert.equal(replay.statusCode, 401);

    const body = replay.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});
