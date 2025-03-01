import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { defineCommand } from "citty";
import glob from "fast-glob";
import yaml from "yaml";
import type * as OpenApi31 from "../3.1/mod.ts";
import type { Api } from "../api.ts";
import { parseApi } from "../api.ts";
import type { ApiHandle } from "../handle/generate.ts";
import { generateApiHandle } from "../handle/generate.ts";
import { consola } from "./consola.ts";
import { loadOpenApiFile, createOperationFilter } from "./openapi.ts";

/** @internal */
export const batchCommand = defineCommand({
  meta: {
    name: "batch",
    description: "Generate Tool Handles from multiple OpenAPI documents",
  },
  args: {
    glob: {
      type: "positional",
      description: "Glob pattern to match OpenAPI files",
      required: true,
    },
    "output-dir": {
      type: "string",
      description:
        "Subdirectory (relative to each OpenAPI file) to write Tool Handles",
      alias: "o",
      default: "tool-handles",
    },
    format: {
      type: "string",
      description: "Output format: json or yaml",
      choices: ["json", "yaml"],
      default: "json",
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
    "skip-errors": {
      type: "boolean",
      description: "Continue processing if an error occurs with one file",
      default: true,
    },
    concurrent: {
      type: "string",
      description: "Maximum number of files to process concurrently",
      default: "4",
    },
  },
  async run(ctx) {
    const startTime = performance.now();

    const globPattern = ctx.args.glob;
    const outputDir = ctx.args["output-dir"];
    const format = ctx.args.format;
    const include = ctx.args.include;
    const exclude = ctx.args.exclude;
    const tags = ctx.args.tags;
    const verbose = ctx.args.verbose;
    const dryRun = ctx.args["dry-run"];
    const overwrite = ctx.args.overwrite;
    const skipExisting = ctx.args["skip-existing"];
    const skipErrors = ctx.args["skip-errors"];
    const concurrent = Number(ctx.args.concurrent);

    // Find all matching files.
    const files = await glob(globPattern, { absolute: true });
    if (files.length === 0) {
      consola.warn("No files matched pattern: " + globPattern);
      return;
    }
    consola.log("Found " + files.length + " OpenAPI files");

    const operationFilter = createOperationFilter(include, exclude, tags);

    // Track stats.
    let processedFiles = 0;
    let skippedFiles = 0;
    let failedFiles = 0;
    let totalOperations = 0;
    let skippedOperations = 0;
    let generatedHandles = 0;

    // Process files in concurrent batches.
    for (let i = 0; i < files.length; i += concurrent) {
      const batch = files.slice(i, i + concurrent).map(async (file) => {
        consola.log("Processing " + file);

        // Load and validate the OpenAPI file.
        let openapi: OpenApi31.OpenApiObject;
        try {
          openapi = await loadOpenApiFile(file);
        } catch (error) {
          if (skipErrors) {
            consola.error("Failed to load " + file + ":", error);
            failedFiles += 1;
            return;
          }
          throw error;
        }

        // Check the OpenAPI version used by the file.
        if (openapi.openapi?.startsWith("3.") !== true) {
          if (verbose) {
            consola.log(
              "Skipping " +
                file +
                " (unsupported version: " +
                openapi.openapi +
                ")",
            );
          }
          skippedFiles += 1;
          return;
        }

        let api: Api;
        try {
          api = await parseApi(openapi);
        } catch (error) {
          if (skipErrors) {
            consola.error("Failed to process " + file + ":", error);
            failedFiles += 1;
            return;
          }
          throw error;
        }

        const operations = [...api.operations()];
        totalOperations += operations.length;

        // Create output directory for this file
        const fileOutputDir = join(dirname(file), outputDir);
        if (!dryRun) {
          await mkdir(fileOutputDir, { recursive: true });
        }

        // Generate a Tool Handle for each operation.
        for (const operation of operations) {
          if (operation.operationId === undefined) {
            if (verbose) {
              consola.warn(
                "Skipping unidentified operation: " +
                  operation.method +
                  " " +
                  operation.path,
              );
            }
            skippedOperations += 1;
            continue;
          }

          if (!operationFilter(operation)) {
            if (verbose) {
              consola.log(
                "Skipping operation " +
                  operation.operationId +
                  " (filtered out)",
              );
            }
            skippedOperations += 1;
            continue;
          }

          let handle: ApiHandle;
          try {
            handle = generateApiHandle(operation);
          } catch (error) {
            consola.error(
              "Failed to generate Tool Handle for " +
                operation.operationId +
                ":",
              error,
            );
            skippedOperations += 1;
            continue;
          }

          const operationId = operation.operationId;
          const segments = operationId.split("/");
          const fileName = segments.pop() + "." + format;
          const dirPath = join(fileOutputDir, ...segments);
          const filePath = join(dirPath, fileName);

          const fileExists = existsSync(filePath);

          if (fileExists && skipExisting) {
            if (verbose) {
              consola.log("Skipping " + operationId + " (file already exists)");
            }
            skippedOperations += 1;
            continue;
          }

          if (fileExists && !overwrite) {
            consola.warn("File already exists: " + filePath);
            skippedOperations += 1;
            continue;
          }

          if (dryRun) {
            consola.log("Would generate " + operationId + " -> " + filePath);
            generatedHandles += 1;
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
            generatedHandles += 1;
          } catch (error) {
            consola.error("Failed to write " + filePath + ":", error);
            continue;
          }
        }

        processedFiles += 1;
      });
      await Promise.all(batch);
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed();

    // Print batch summary.
    consola.log("");
    consola.success("Batch processing completed in " + duration + "s");
    consola.log("Files processed: " + processedFiles);
    if (skippedFiles !== 0) {
      consola.log("Files skipped: " + skippedFiles);
    }
    if (failedFiles !== 0) {
      consola.warn("Files failed: " + failedFiles);
    }
    consola.log("Operations found: " + totalOperations);
    if (skippedOperations !== 0) {
      consola.log("Operations skipped: " + skippedOperations);
    }
    consola.success("Tool Handles generated: " + generatedHandles);

    if (dryRun) {
      consola.log("DRY RUN: No files were actually written");
    }
  },
});
