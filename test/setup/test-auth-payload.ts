export const DEFAULT_TEST_LANGUAGE = "de" as const;

export function otpRequestPayload(email: string, language = DEFAULT_TEST_LANGUAGE) {
    return { email, language };
}

export function loginRequestPayload(
    email: string,
    otp: string,
    language = DEFAULT_TEST_LANGUAGE,
) {
    return { email, otp, language };
}
