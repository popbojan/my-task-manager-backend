# my-task-manager-backend

#### OPEN API SPEC GENERATION

This project consumes the OpenAPI specification from a separate GitHub repository.

Whenever the OpenAPI spec changes (new endpoints, schema updates, version bump), follow the steps below to update and regenerate the types.

---

#### 1. Update the OpenAPI Spec Version in `package.json`

Update the dependency to the correct Git tag (for example `v1.0.4`):

```json
"@popbojan/task-manager-contract": "github:popbojan/my-task-manager-spec#v1.0.4"
```

Make sure the corresponding tag exists in the spec repository.

---

#### 2. Remove existing dependencies and lock file

```bash
rm -rf node_modules package-lock.json
```

---

#### 3. Verify npm cache

```bash
npm cache verify
```

---

#### 4. Reinstall dependencies

```bash
npm install
```

This ensures the correct tagged version of the OpenAPI spec is installed.

---

#### 5. Regenerate TypeScript types from OpenAPI

```bash
npm run generate-types
```

This will regenerate the API types based on the updated OpenAPI specification.

---

#### Notes

- Ensure the OpenAPI spec repository has the correct `info.version` updated.
- Ensure the Git tag (e.g. `v1.0.4`) exists and is pushed.
- If types are not updated, verify that the installed `openapi.yaml` inside `node_modules/@popbojan/task-manager-contract` reflects the expected version.
