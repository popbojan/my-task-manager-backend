import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { createTestAccessToken } from "../../setup/test-token.js";
import { ensureUser } from "../../setup/test-database-helpers.js";
import { loginRequestPayload } from "../../setup/test-auth-payload.js";
import { computeTestOtp } from "../../setup/test-otp.js";

const ctx = setupIntegrationTestContext();

test("GET /users/me returns current authenticated user", async () => {
    const email = "current-user@example.com";
    await ensureUser(ctx.prisma, email, "de");
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/users/me",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.email, email);
    assert.equal(body.language, "de");
    assert.ok(body.id);
});

test("PATCH /users/me/preferences updates user language", async () => {
    const email = "preferences-user@example.com";
    await ensureUser(ctx.prisma, email, "en");
    const token = createTestAccessToken(email);

    const response = await ctx.fastify.inject({
        method: "PATCH",
        url: "/users/me/preferences",
        headers: {
            authorization: `Bearer ${token}`,
        },
        payload: {
            language: "sr",
        },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { language: "sr" });

    const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { email },
    });

    assert.equal(user.language, "sr");
});

test("POST /auth/login-with-otp stores requested language on user", async () => {
    const email = "login-language-user@example.com";
    const otp = computeTestOtp(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: loginRequestPayload(email, otp, "de"),
    });

    assert.equal(response.statusCode, 200);

    const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { email },
    });

    assert.equal(user.language, "de");
});

test("GET /users/me returns 401 when token is invalid", async () => {
    const response = await ctx.fastify.inject({
        method: "GET",
        url: "/users/me",
        headers: {
            authorization: "Bearer invalid-token",
        },
    });

    assert.equal(response.statusCode, 401);
});
