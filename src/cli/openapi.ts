import { readFile } from "node:fs/promises";
import yaml from "yaml";
import type * as OpenApi31 from "../3.1/mod.ts";
import type { ApiOperation } from "../api.ts";

/**
 * Loads an OpenAPI document from a file path.
 *
 * @internal
 */
export async function loadOpenApiFile(
  filePath: string,
): Promise<OpenApi31.OpenApiObject> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
      return yaml.parse(fileContent) as OpenApi31.OpenApiObject;
    } else {
      return JSON.parse(fileContent) as OpenApi31.OpenApiObject;
    }
  } catch (error) {
    throw new Error("Failed to load OpenAPI file: " + filePath, {
      cause: error,
    });
  }
}

/**
 * Returns a function that filters operations based on include/exclude
 * patterns and tags.
 *
 * @internal
 */
export function createOperationFilter(
  include: string | undefined,
  exclude: string | undefined,
  tags: string | undefined,
): (operation: ApiOperation) => boolean {
  const includeRegex = include !== undefined ? new RegExp(include) : undefined;
  const excludeRegex = exclude !== undefined ? new RegExp(exclude) : undefined;
  const tagSet =
    tags !== undefined ?
      new Set(tags.split(",").map((tag) => tag.trim()))
    : undefined;

  return (operation: ApiOperation): boolean => {
    // Check if the operation has one of the specified tags.
    if (
      tagSet !== undefined &&
      operation.tags !== undefined &&
      !operation.tags.some((tag) => tagSet.has(tag))
    ) {
      return false;
    }

    // Check if the operationId matches the include pattern.
    if (
      operation.operationId !== undefined &&
      includeRegex !== undefined &&
      !includeRegex?.test(operation.operationId)
    ) {
      return false;
    }

    // Check if the operationId matches the exclude pattern.
    if (
      operation.operationId !== undefined &&
      excludeRegex?.test(operation.operationId) === true
    ) {
      return false;
    }

    return true;
  };
}
