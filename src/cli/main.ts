import { defineCommand } from "citty";
import { listCommand } from "./list.ts";
import { generateCommand } from "./generate.ts";
import { batchCommand } from "./batch.ts";

export const mainCommand = defineCommand({
  meta: {
    name: "tool-api",
    description: "Generate Tool Handles from OpenAPI documents",
  },
  subCommands: {
    list: listCommand,
    generate: generateCommand,
    batch: batchCommand,
  },
});
