export function toFastifySchema(schema: unknown): unknown {
    if (Array.isArray(schema)) {
        return schema.map(toFastifySchema);
    }

    if (schema && typeof schema === "object") {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(schema)) {
            if (key === "example") continue;

            if (key === "nullable" && value === true) {
                continue;
            }

            result[key] = toFastifySchema(value);
        }

        return result;
    }

    return schema;
}