import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineCommand } from "citty";
import yaml from "yaml";
import type * as OpenApi31 from "../3.1/mod.ts";
import { parseApi } from "../api.ts";
import type { ApiHandleOptions, ApiHandle } from "../handle/generate.ts";
import { generateApiHandle } from "../handle/generate.ts";
import { consola } from "./consola.ts";
import { loadOpenApiFile, createOperationFilter } from "./openapi.ts";

/** @internal */
export const generateCommand = defineCommand({
  meta: {
    name: "generate",
    description: "Generate HTTP Tool Handles from an OpenAPI document",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to the OpenAPI document",
      required: true,
    },
    "output-dir": {
      type: "string",
      description: "Directory in which to write the generated Tool Handles",
      alias: "o",
      default: "./",
    },
    format: {
      type: "string",
      description: "Output format: json or yaml",
      choices: ["json", "yaml"],
      default: "json",
    },
    "server-url": {
      type: "string",
      description: "Override the server URL for all operations",
    },
    include: {
      type: "string",
      description:
        "Only generate Tool Handles for operations matching this pattern",
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
    verbose: {
      type: "boolean",
      description: "Print detailed information during processing",
      alias: "v",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview what would be generated without writing files",
    },
    overwrite: {
      type: "boolean",
      description: "Force overwrite if files already exist",
      default: true,
    },
    "skip-existing": {
      type: "boolean",
      description: "Skip generation if file already exists",
    },
  },
  async run(ctx) {
    const input = ctx.args.input;
    const outputDir = ctx.args["output-dir"];
    const format = ctx.args.format;
    const serverUrl = ctx.args["server-url"];
    const include = ctx.args.include;
    const exclude = ctx.args.exclude;
    const tags = ctx.args.tags;
    const verbose = ctx.args.verbose;
    const dryRun = ctx.args["dry-run"];
    const overwrite = ctx.args.overwrite;
    const skipExisting = ctx.args["skip-existing"];

    const openapi = await loadOpenApiFile(input);
    const api = await parseApi(openapi);

    const operationFilter = createOperationFilter(include, exclude, tags);

    const handleOptions: ApiHandleOptions = {};

    if (serverUrl !== undefined) {
      handleOptions.server = { url: serverUrl } as OpenApi31.ServerObject;
    }

    let generatedCount = 0;
    let skippedCount = 0;

    // Generate a Tool Handle for each operation.
    for (const operation of api.operations()) {
      if (operation.operationId === undefined) {
        if (verbose) {
          consola.warn(
            "Skipping unidentified operation: " +
              operation.method +
              " " +
              operation.path,
          );
        }
        skippedCount += 1;
        continue;
      }

      if (!operationFilter(operation)) {
        if (verbose) {
          consola.log(
            "Skipping operation " + operation.operationId + " (filtered out)",
          );
        }
        skippedCount += 1;
        continue;
      }

      let handle: ApiHandle;
      try {
        handle = generateApiHandle(operation, handleOptions);
      } catch (error) {
        consola.error(
          "Failed to generate Tool Handle for " + operation.operationId + ":",
          error,
        );
        skippedCount += 1;
        continue;
      }

      const operationId = operation.operationId;
      const segments = operationId.split("/");
      const fileName = segments.pop() + "." + format;
      const dirPath = join(outputDir, ...segments);
      const filePath = join(dirPath, fileName);

      const fileExists = existsSync(filePath);

      if (fileExists && skipExisting) {
        if (verbose) {
          consola.log("Skipping " + operationId + " (file already exists)");
        }
        skippedCount += 1;
        continue;
      }

      if (fileExists && !overwrite) {
        consola.warn("File already exists: " + filePath);
        skippedCount += 1;
        continue;
      }

      if (dryRun) {
        consola.log("Would generate " + operationId + " -> " + filePath);
        generatedCount += 1;
        continue;
      }

      if (verbose) {
        consola.log("Generating " + operationId + " -> " + filePath);
      }

      const output =
        format === "yaml" ?
          yaml.stringify(handle)
        : JSON.stringify(handle, null, 2) + "\n";

      try {
        await mkdir(dirPath, { recursive: true });
        await writeFile(filePath, output);
        generatedCount += 1;
      } catch (error) {
        consola.error("Failed to write " + filePath + ":", error);
        continue;
      }
    }

    let summary = "Generated " + generatedCount + " Tool Handles";
    if (skippedCount !== 0) {
      summary += "; skipped " + skippedCount + " operations";
    }
    consola.success(summary);

    if (dryRun) {
      consola.log("DRY RUN: No files were actually written");
    }
  },
});
