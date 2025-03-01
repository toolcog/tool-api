import type { ApiContext } from "../context.ts";
import type { ServerObject } from "./server.ts";
import type { OperationObject } from "./operation.ts";
import type { ReferenceObject } from "./reference.ts";
import type { ApiParser } from "./parser.ts";

export type LinksObject = {
  readonly [key: string]: LinkObject | ReferenceObject;
};

/**
 * The Link Object represents a possible design-time link for a response.
 * The presence of a link does not guarantee the caller's ability to
 * successfully invoke it, rather it provides a known relationship and
 * traversal mechanism between responses and other operations.
 *
 * Unlike dynamic links (i.e. links provided in the response payload),
 * the OAS linking mechanism does not require link information in the
 * runtime response.
 *
 * For computing links and providing instructions to execute them, a [runtime
 * expression](https://spec.openapis.org/oas/v3.1.1.html#runtime-expressions)
 * is used for accessing values in an operation and using them as parameters
 * while invoking the linked operation.
 *
 * @see [OpenAPI Specification §4.8.20](https://spec.openapis.org/oas/v3.1.1.html#link-object)
 */
export interface LinkObject {
  /**
   * A URI reference to an OAS operation. This field is mutually exclusive
   * of the `operationId` field, and _MUST_ point to an
   * {@link OperationObject Operation Object}. Relative `operationRef` values
   * _MAY_ be used to locate an existing Operation Object in the OpenAPI
   * Description.
   */
  readonly operationRef?: string;

  /**
   * The name of an existing, resolvable OAS operation, as defined with
   * a unique `operationId`. This field is mutually exclusive of the
   * `operationRef` field.
   */
  readonly operationId?: string;

  /**
   * A map representing parameters to pass to an operation as specified with
   * `operationId` or identified via `operationRef`. The key is the parameter
   * name to be used (optionally qualified with the parameter location,
   * e.g. `path.id` for an `id` parameter in the path), whereas the value
   * can be a constant or an expression to be evaluated and passed to the
   * linked operation.
   */
  readonly parameters?: { readonly [key: string]: string };

  /**
   * A literal value or [`{expression}`](
   * https://spec.openapis.org/oas/v3.1.1.html#runtime-expressions)
   * to use as a request body when calling the target operation.
   */
  readonly requestBody?: unknown;

  /**
   * A description of the link. [CommonMark](https://spec.commonmark.org/)
   * syntax _MAY_ be used for rich text representation.
   */
  readonly description?: string;

  /**
   * A server object to be used by the target operation.
   */
  readonly server?: ServerObject;
}

/** @internal */
export function parseLinkReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseLinkObject);
}

/** @internal */
export function parseLinkObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(context, parser, node, "Link Object", parseLinkField);
}

/** @internal */
function parseLinkField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "operationRef":
      parser.parseString(context, parser, value, key);
      break;
    case "operationId":
      parser.parseString(context, parser, value, key);
      break;
    case "parameters":
      parser.parseObject(context, parser, value, key, parser.parseString);
      break;
    case "requestBody":
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "server":
      parser.parseServerObject(context, parser, value);
      break;
    default:
      parser.parseExtension(context, "Link Object", key, value);
  }
}
