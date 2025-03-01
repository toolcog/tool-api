import type { ApiContext } from "../context.ts";
import type { ParameterObject } from "./parameter.ts";
import type { EncodingObject } from "./encoding.ts";
import type { ResponseObject } from "./response.ts";
import type { ExampleObject } from "./example.ts";
import type { MediaTypeObject } from "./media-type.ts";
import type { ReferenceObject } from "./reference.ts";
import type { SchemaObject } from "./schema.ts";
import type { ApiParser } from "./parser.ts";

export type HeadersObject = {
  readonly [key: string]: HeaderObject | ReferenceObject;
};

/**
 * Describes a single header for {@link ResponseObject.headers HTTP responses}
 * and for
 * {@link EncodingObject.headers individual parts in `multipart` representations};
 * see the relevant {@link ResponseObject Response Object} and
 * {@link EncodingObject Encoding Object} documentation for restrictions
 * on which headers can be described.
 *
 * The Header Object follows the structure of the
 * {@link ParameterObject Parameter Object}, including determining its
 * serialization strategy based on whether `schema` or `content` is present,
 * with the following changes:
 *
 * - `name` _MUST NOT_ be specified, it is given in the corresponding
 *   `headers` map.
 * - `in` _MUST NOT_ be specified, it is implicitly in `header`.
 * - All traits that are affected by the location _MUST_ be applicable to a
 *   location of `header` (for example, {@link ParameterObject.style `style`}).
 *   This means that `allowEmptyValue` and `allowReserved` _MUST NOT_ be used,
 *   and `style`, if used, _MUST_ be limited to `"simple"`.
 *
 * @see [OpenAPI Specification §4.8.21](https://spec.openapis.org/oas/v3.1.1.html#header-object)
 */
export interface HeaderObject {
  /**
   * A brief description of the header. This could contain examples of use.
   * [CommonMark](https://spec.commonmark.org/) syntax _MAY_ be used for
   * rich text representation.
   */
  readonly description?: string;

  /**
   * Determines whether this header is mandatory.
   * The default value is `false`.
   */
  readonly required?: boolean;

  /**
   * Specifies that the header is deprecated and _SHOULD_ be transitioned
   * out of usage. Default value is `false`.
   */
  readonly deprecated?: boolean;

  /**
   * Describes how the header value will be serialized. The default
   * (and only legal value for headers) is `"simple"`.
   */
  readonly style?: string;

  /**
   * When this is `true`, header values of type `array` or `object` generate
   * a single header whose value is a comma-separated list of the array items
   * or key-value pairs of the map. For other data types this field has no
   * effect. The default value is `false`.
   */
  readonly explode?: boolean;

  /**
   * The schema defining the type used for the header.
   */
  readonly schema?: SchemaObject | ReferenceObject;

  /**
   * Example of the header's potential value.
   */
  readonly example?: unknown;

  /**
   * Examples of the header's potential value.
   */
  readonly examples?: {
    readonly [name: string]: ExampleObject | ReferenceObject;
  };

  /**
   * A map containing the representations for the header. The key is the
   * media type and the value describes it. The map _MUST_ only contain
   * one entry.
   */
  readonly content?: { readonly [mediaRange: string]: MediaTypeObject };
}

/** @internal */
export function parseHeaderReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseHeaderObject);
}

/** @internal */
export function parseHeaderObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(context, parser, node, "Header Object", parseHeaderField);
}

/** @internal */
function parseHeaderField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "required":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "deprecated":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "style":
      parser.parseString(context, parser, value, key);
      break;
    case "explode":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "schema":
      parser.parseSchemaObject(context, parser, value);
      break;
    case "example":
      break;
    case "examples":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseExampleReference,
      );
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
    default:
      parser.parseExtension(context, "Header Object", key, value);
  }
}
