import test from "node:test";
import assert from "node:assert/strict";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { assertBodyValidationFailed } from "../../setup/assert-http.js";
import {
    DEFAULT_TEST_LANGUAGE,
    otpRequestPayload,
} from "../../setup/test-auth-payload.js";

const ctx = setupIntegrationTestContext();

test("POST /auth/request-otp returns 200 and success message", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/request-otp",
        payload: otpRequestPayload("test@example.com"),
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.message, "OTP sent to your email");
});

test("POST /auth/request-otp returns 400 for invalid email format", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/request-otp",
        payload: otpRequestPayload("invalid-email"),
    });

    assert.equal(response.statusCode, 400);

    assertBodyValidationFailed(response.json(), /email/i);
});

test("POST /auth/request-otp returns 400 when email is missing", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/request-otp",
        payload: { language: DEFAULT_TEST_LANGUAGE },
    });

    assert.equal(response.statusCode, 400);

    assertBodyValidationFailed(response.json(), /email/i);
});
