import type { ApiContext } from "../context.ts";
import type { OpenApiObject } from "./openapi.ts";
import type { PathItemObject } from "./path.ts";
import type { ReferenceObject } from "./reference.ts";
import type { ApiParser } from "./parser.ts";

export type CallbacksObject = {
  readonly [key: string]: CallbackObject | ReferenceObject;
};

/**
 * A map of possible out-of band callbacks related to the parent operation.
 * Each value in the map is a {@link PathItemObject Path Item Object} that
 * describes a set of requests that may be initiated by the API provider
 * and the expected responses. The key value used to identify the Path Item
 * Object is an expression, evaluated at runtime, that identifies a URL
 * to use for the callback operation.
 *
 * To describe incoming requests from the API provider independent from
 * another API call, use the {@link OpenApiObject.webhooks `webhooks`} field.
 *
 * @see [OpenAPI Specification §4.8.18](https://spec.openapis.org/oas/v3.1.1.html#callback-object)
 */
export interface CallbackObject {
  /**
   * A Path Item Object used to define a callback request and
   * expected responses.
   */
  readonly [expression: string]: PathItemObject;
}

/** @internal */
export function parseCallbackReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseCallbackObject);
}

/** @internal */
export function parseCallbackObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Callback Object",
    parseCallbackField,
  );
}

/** @internal */
function parseCallbackField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  if (key.startsWith("x-")) {
    parser.parseExtension(context, "Callback Object", key, value);
  }
  parser.parsePathItemObject(context, parser, value);
}
