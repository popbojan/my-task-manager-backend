import test from "node:test";
import assert from "node:assert/strict";
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

test("POST /auth/logout returns 401 without refresh cookie", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/logout",
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
    assert.match(body.message, /missing/i);
});

test("POST /auth/logout returns 401 for invalid refresh token", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/logout",
        headers: {
            cookie: "refreshToken=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        },
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});

test("POST /auth/logout returns 204 and rejects subsequent refresh", async () => {
    const email = "logout-user@example.com";
    const refresh = await loginAndGetRefreshCookie(email);

    const logoutRes = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/logout",
        headers: {
            cookie: `refreshToken=${refresh}`,
        },
    });

    assert.equal(logoutRes.statusCode, 204);
    assert.ok(logoutRes.headers["set-cookie"]);

    const refreshAfter = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/refresh",
        headers: {
            cookie: `refreshToken=${refresh}`,
        },
    });

    assert.equal(refreshAfter.statusCode, 401);

    const body = refreshAfter.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
});
