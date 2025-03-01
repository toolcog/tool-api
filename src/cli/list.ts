import { defineCommand } from "citty";
import { parseApi } from "../api.ts";
import { consola } from "./consola.ts";
import { loadOpenApiFile, createOperationFilter } from "./openapi.ts";

/** @internal */
export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List operations in an OpenAPI document",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to the OpenAPI document",
      required: true,
    },
    include: {
      type: "string",
      description: "Only list operations matching this pattern",
    },
    exclude: {
      type: "string",
      description: "Skip operations matching this pattern",
    },
    tags: {
      type: "string",
      description:
        "Only include operations with specific tags (comma-separated)",
    },
  },
  async run(ctx) {
    const input = ctx.args.input;
    const include = ctx.args.include;
    const exclude = ctx.args.exclude;
    const tags = ctx.args.tags;

    const openapi = await loadOpenApiFile(input);
    const api = await parseApi(openapi, {});

    const operations = [...api.operations()].filter(
      createOperationFilter(include, exclude, tags),
    );

    consola.log("Operations in " + input);
    console.log();

    for (const operation of operations) {
      console.log(operation.method + " " + operation.path);
      if (operation.operationId !== undefined) {
        console.log("ID: " + operation.operationId);
      }
      if (operation.tags !== undefined && operation.tags.length !== 0) {
        console.log("TAGS: " + operation.tags.join(", "));
      }
      console.log();
    }

    consola.success("Found " + operations.length + " operation(s)");
  },
});
