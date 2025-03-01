import { ApiError } from "../error.ts";
import type { ApiOperation } from "../api.ts";
import type { ApiHandleRequestOptions, ApiHandleRequest } from "./request.ts";
import { generateApiHandleRequest } from "./request.ts";
import type {
  ApiHandleResponsesOptions,
  ApiHandleResponses,
} from "./responses.ts";
import { generateApiHandleResponses } from "./responses.ts";

/**
 * Options for generating a Tool Handle for an OpenAPI operation.
 *
 * @category Handle
 */
export interface ApiHandleOptions
  extends ApiHandleRequestOptions,
    ApiHandleResponsesOptions {}

/**
 * A Tool Handle for an OpenAPI operation.
 *
 * @category Handle
 */
export interface ApiHandle extends ApiHandleRequest, ApiHandleResponses {
  /**
   * The name of the tool.
   */
  name: string;

  /**
   * A description of the tool.
   */
  description?: string | undefined;

  /**
   * The JSON Schema for the tool's parameters.
   * @override
   */
  parameters: object;

  /**
   * The handler to use.
   */
  handler: "http";
}

/**
 * Generates a Tool Handle request template for an OpenAPI operation.
 *
 * @category Handle
 */
export function generateApiHandle(
  operation: ApiOperation,
  options?: ApiHandleOptions,
): ApiHandle {
  let name = operation.operationId ?? operation.method + " " + operation.path;
  if (name === undefined) {
    throw new ApiError("Unnamed operation");
  }
  name = name.replace(/[^a-zA-Z0-9_-]/g, "_");

  const description = operation.description ?? operation.summary;

  const { parameters, request } = generateApiHandleRequest(operation, options);
  const { responses } = generateApiHandleResponses(operation, options);

  return {
    name,
    ...(description !== undefined ? { description } : undefined),
    parameters,
    handler: "http",
    request,
    responses,
  };
}
