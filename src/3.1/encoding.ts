import type { ApiContext } from "../context.ts";
import type { ParameterObject } from "./parameter.ts";
import type { HeaderObject } from "./header.ts";
import type { ReferenceObject } from "./reference.ts";
import type { ApiParser } from "./parser.ts";

export type EncodingsObject = { readonly [mediaType: string]: EncodingObject };

/**
 * A single encoding definition applied to a single schema property.
 *
 * @see [OpenAPI Specification §4.8.15](https://spec.openapis.org/oas/v3.1.1.html#fixed-fields-12)
 */
export interface EncodingObject {
  /**
   * The `Content-Type` for encoding a specific property. The value is a
   * comma-separated list, each element of which is either a specific
   * media type (e.g. `image/png`) or a wildcard media type (e.g. `image/*`).
   */
  readonly contentType: string;

  /**
   * A map allowing additional information to be provided as headers.
   * `Content-Type` is described separately and _SHALL_ be ignored in this
   * section. This field _SHALL_ be ignored if the request body media type
   * is not a `multipart`.
   */
  readonly headers?: { readonly [key: string]: HeaderObject | ReferenceObject };

  /**
   * Describes how a specific property value will be serialized depending
   * on its type. See {@link ParameterObject Parameter Object} for details on
   * the {@link ParameterObject.style `style`} field. The behavior follows
   * the same values as `query` parameters, including default values.
   * Note that the initial `?` used in query strings is not used in
   * `application/x-www-form-urlencoded` message bodies, and _MUST_ be
   * removed (if using an RFC6570 implementation) or simply not added
   * (if constructing the string manually). This field _SHALL_ be ignored if
   * the request body media type is not `application/x-www-form-urlencoded`
   * or `multipart/form-data`. If a value is explicitly defined,
   * then the value of {@link EncodingObject.contentType `contentType`}
   * (implicit or explicit) SHALL be ignored.
   */
  readonly style?: string;

  /**
   * When this is `true`, property values of type `array` or `object`
   * generate separate parameters for each value of the array, or
   * key-value-pair of the map. For other types of properties this field
   * has no effect. When {@link EncodingObject.style `style`} is `"form"`,
   * the default value is `true`. For all other styles, the default value
   * is `false`. Note that despite `false` being the default for `deepObject`,
   * the combination of `false` with `deepObject` is undefined. This field
   * _SHALL_ be ignored if the request body media type is not
   * `application/x-www-form-urlencoded` or `multipart/form-data`.
   * If a value is explicitly defined, then the value of
   * {@link EncodingObject.contentType `contentType`} (implicit or explicit)
   * _SHALL_ be ignored.
   */
  readonly explode?: boolean;

  /**
   * When this is `true`, parameter values are serialized using reserved
   * expansion, as defined by [RFC6570](
   * https://www.rfc-editor.org/rfc/rfc6570) [Section 3.2.3]
   * (https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3),
   * which allows [RFC3986's reserved character set](
   * https://tools.ietf.org/html/rfc3986#section-2.2), as well as
   * percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters (including `%` outside
   * of percent-encoded triples). Applications are still responsible for
   * percent-encoding reserved characters that are [not allowed in the query
   * string](https://tools.ietf.org/html/rfc3986#section-3.4) (`[`, `]`, `#`),
   * or have a special meaning in `application/x-www-form-urlencoded`
   * (`-`, `&amp;`, `+`). The default value is `false`. This field _SHALL_
   * be ignored if the request body media type is not
   * `application/x-www-form-urlencoded` or `multipart/form-data`.
   * If a value is explicitly defined, then the value of
   * {@link EncodingObject.contentType `contentType`} (implicit or explicit)
   * _SHALL_ be ignored.
   */
  readonly allowReserved?: boolean;
}

/** @internal */
export function parseEncodingObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Encoding Object",
    parseEncodingField,
  );
}

/** @internal */
function parseEncodingField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "contentType":
      parser.parseString(context, parser, value, key);
      break;
    case "headers":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseHeaderReference,
      );
      break;
    case "style":
      parser.parseString(context, parser, value, key);
      break;
    case "explode":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "allowReserved":
      parser.parseBoolean(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "Encoding Object", key, value);
  }
}
