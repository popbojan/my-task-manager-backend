import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import $RefParser from "@apidevtools/json-schema-ref-parser";

export async function loadOpenApiRuntimeSpec() {
    const openApiPath = path.resolve("node_modules/@popbojan/task-manager-contract/openapi.yaml");

    const file = fs.readFileSync(openApiPath, "utf8");
    const spec = YAML.parse(file);

    return await $RefParser.dereference(spec);
}
