import type { SchemaContext, SchemaContextOptions } from "tool-schema";
import { createSchemaContext } from "tool-schema";
import type { ApiParser } from "./3.1/parser.ts";

/**
 * A context for OpenAPI processing.
 *
 * @category Context
 */
export interface ApiContext extends SchemaContext {
  /** @internal */
  apiParser: ApiParser | undefined;
}

/**
 * Options for configuring an API context.
 *
 * @category Context
 */
export interface ApiContextOptions extends SchemaContextOptions {
  /**
   * The default JSON Schema dialect to use for OpenAPI documents.
   */
  jsonSchemaDialect?: string | undefined;
}

/**
 * Initializes a context for OpenAPI processing.
 *
 * @category Context
 */
export function initApiContext(
  context: SchemaContext & Partial<ApiContext>,
  options?: ApiContextOptions,
): ApiContext {
  if (!("apiParser" in context)) {
    context.apiParser = undefined;
  }

  return context as ApiContext;
}

/**
 * Creates a new shared context for OpenAPI processing.
 *
 * @category Context
 */
export function createApiContext(options?: ApiContextOptions): ApiContext {
  return initApiContext(createSchemaContext(options), options);
}
