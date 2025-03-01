import type { ApiContext } from "../context.ts";
import type { MediaTypeObject } from "./media-type.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Describes a single request body.
 *
 * @see [OpenAPI Specification §4.8.13](https://spec.openapis.org/oas/v3.1.1.html#request-body-object)
 */
export interface RequestBodyObject {
  /**
   * A brief description of the request body. This _COULD_ contain examples
   * of use. [CommonMark](https://spec.commonmark.org/) syntax _MAY_ be used
   * for rich text representation.
   */
  readonly description?: string;

  /**
   * The content of the request body. The key is a media type or media type
   * range, see [RFC7231](https://httpwg.org/specs/rfc7231.html) [Appendix D](
   * https://datatracker.ietf.org/doc/html/rfc7231#appendix-D), and the value
   * describes it. For requests that match multiple keys, only the most
   * specific key is applicable. e.g. `"text/plain"` overrides `"text/*"`.
   */
  readonly content?: { readonly [mediaType: string]: MediaTypeObject };

  /**
   * Determines if the request body is required in the request.
   * Defaults to `false`.
   */
  readonly required?: boolean;
}

/** @internal */
export function parseRequestBodyReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseRequestBodyObject);
}

/** @internal */
export function parseRequestBodyObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Request Body Object",
    parseRequestBodyField,
  );
}

/** @internal */
function parseRequestBodyField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "content":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseMediaTypeObject,
      );
      break;
    case "required":
      parser.parseBoolean(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "Request Body Object", key, value);
  }
}
