import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { setupIntegrationTestContext } from "../../setup/integration-test-context.js";
import { computeTestOtp } from "../../setup/test-otp.js";
import { getSetCookieValue } from "../../setup/set-cookie.js";
import { assertBodyValidationFailed } from "../../setup/assert-http.js";
import {
    DEFAULT_TEST_LANGUAGE,
    loginRequestPayload,
} from "../../setup/test-auth-payload.js";

const ctx = setupIntegrationTestContext();

test("POST /auth/login-with-otp returns access token and refresh cookie for valid OTP", async () => {
    const email = "otp-login@example.com";
    const otp = computeTestOtp(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: loginRequestPayload(email, otp),
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.ok(typeof body.accessToken === "string" && body.accessToken.length > 0);

    const decoded = jwt.verify(body.accessToken, process.env.JWT_SECRET!, {
        algorithms: ["HS256"],
    }) as { sub?: string; email?: string };

    assert.equal(decoded.email, email);
    assert.ok(typeof decoded.sub === "string" && decoded.sub.length > 0);

    const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { email },
    });

    assert.equal(decoded.sub, user.id);
    assert.equal(decoded.email, email);

    const refresh = getSetCookieValue(response.headers["set-cookie"], "refreshToken");
    assert.ok(refresh && refresh.length > 0);
});

test("POST /auth/login-with-otp accepts OTP with surrounding whitespace", async () => {
    const email = "otp-trim@example.com";
    const otp = computeTestOtp(email);

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: loginRequestPayload(email, `  ${otp}  `),
    });

    assert.equal(response.statusCode, 200);
    assert.ok(response.json().accessToken);
});

test("POST /auth/login-with-otp returns 401 for wrong OTP", async () => {
    const email = "otp-wrong@example.com";

    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: loginRequestPayload(email, "000000"),
    });

    assert.equal(response.statusCode, 401);

    const body = response.json();

    assert.equal(body.statusCode, 401);
    assert.equal(body.error, "Unauthorized");
    assert.match(body.message, /otp/i);
});

test("POST /auth/login-with-otp returns 400 for invalid email format", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: loginRequestPayload("not-an-email", "123456"),
    });

    assert.equal(response.statusCode, 400);
    assertBodyValidationFailed(response.json(), /email/i);
});

test("POST /auth/login-with-otp returns 400 when otp is missing", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: { email: "user@example.com", language: DEFAULT_TEST_LANGUAGE },
    });

    assert.equal(response.statusCode, 400);
    assertBodyValidationFailed(response.json(), /otp/i);
});

test("POST /auth/login-with-otp returns 400 when email is missing", async () => {
    const response = await ctx.fastify.inject({
        method: "POST",
        url: "/auth/login-with-otp",
        payload: { otp: "123456", language: DEFAULT_TEST_LANGUAGE },
    });

    assert.equal(response.statusCode, 400);
    assertBodyValidationFailed(response.json(), /email/i);
});
