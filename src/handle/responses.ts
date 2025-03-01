import { isObject, treeShakeReferences } from "tool-json";
import type { ApiOperation, ApiResponse } from "../api.ts";
import { generateSchemaTemplate } from "./schema.ts";

/**
 * Options for generating Tool Handle responses for an OpenAPI operation.
 *
 * @category Handle
 */
export interface ApiHandleResponsesOptions {
  /**
   * An additional transformation to apply when rewriting JSON Schema nodes.
   */
  transform?: ((node: unknown) => unknown) | undefined;
}

/**
 * Tool Handle responses for an OpenAPI operation.
 *
 * @category Handle
 */
export interface ApiHandleResponses {
  /**
   * Mapping from response codes to Tool Form response templates.
   */
  responses: {
    [status: string]: unknown;
  };
}

/**
 * Generates the response-side of a Tool Handle for an OpenAPI operation.
 *
 * @category Handle
 */
export function generateApiHandleResponses(
  operation: ApiOperation,
  options?: ApiHandleResponsesOptions,
): ApiHandleResponses {
  // Tree-shaking book-keeping.
  const responseIndex: Record<string, [number, ApiResponse]> = {};
  const schemaRoots: object[] = [];

  // Extract response schemas.
  for (const response of operation.responses) {
    for (const contentType of response.content) {
      if (!isObject(contentType.schema)) {
        continue;
      }
      responseIndex[response.key] = [schemaRoots.length, response];
      schemaRoots.push(contentType.schema);
      break;
    }
  }

  // Tree-shake the response schemas.
  const result = treeShakeReferences(operation.api.context, {
    roots: schemaRoots,
    defsUri: "#/$defs",
    ...options,
  });

  // Construct the response templates.
  const responses: Record<string, unknown> = {};
  for (const [code, [index, response]] of Object.entries(responseIndex)) {
    responses[code] = generateSchemaTemplate(
      operation.api.context,
      { varname: "body", depth: 1, response, operation },
      result.roots[index],
    );
  }

  return { responses };
}
