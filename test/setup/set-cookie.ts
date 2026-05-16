/** Reads a cookie value from Fastify `inject` `set-cookie` header(s). */
export function getSetCookieValue(
    setCookie: string | string[] | undefined,
    cookieName: string,
): string | undefined {
    const lines = Array.isArray(setCookie)
        ? setCookie
        : setCookie != null
          ? [setCookie]
          : [];

    const prefix = `${cookieName}=`;

    for (const line of lines) {
        const idx = line.indexOf(prefix);
        if (idx === -1) continue;

        const fromValue = idx + prefix.length;
        const semiIdx = line.indexOf(";", fromValue);
        const raw =
            semiIdx === -1 ? line.slice(fromValue) : line.slice(fromValue, semiIdx);
        return raw.trim();
    }

    return undefined;
}
