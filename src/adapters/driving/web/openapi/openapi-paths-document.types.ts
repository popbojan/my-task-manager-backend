/** Dereferenced OpenAPI doc — only the fragments used for JSON body schemas on routes. */
export type OpenApiPathsDocument = {
    paths: Record<
        string,
        {
            post?: {
                requestBody?: {
                    content: { "application/json": { schema: unknown } };
                };
            };
            patch?: {
                requestBody?: {
                    content: { "application/json": { schema: unknown } };
                };
            };
        }
    >;
};
