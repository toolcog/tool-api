import type { ApiContext } from "../context.ts";
import type { PathsObject } from "./path.ts";
import type { MediaTypeObject } from "./media-type.ts";
import type { ExampleObject } from "./example.ts";
import type { ReferenceObject } from "./reference.ts";
import type { SchemaObject } from "./schema.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Describes a single operation parameter. A unique parameter is defined
 * by a combination of a {@link ParameterObject.name name} and
 * {@link ParameterObject.in location}.
 *
 * @see [OpenAPI Specification §4.8.12](https://spec.openapis.org/oas/v3.1.1.html#parameter-object)
 */
export interface ParameterObject {
  /**
   * The name of the parameter. Parameter names are _case sensitive_.
   *
   * - If {@link ParameterObject.in `in`} is `"path"`, the `name` field _MUST_
   *   correspond to a template expression occurring within the
   *   {@link PathsObject:index path} field in the
   *   {@link PathsObject Paths Object}. See [Path Templating](
   *   https://spec.openapis.org/oas/v3.1.1.html#path-templating)
   *   for further information.
   * - If {@link ParameterObject.in `in`} is `"header"` and the `name` field
   *   is `"Accept"`, `"Content-Type"` or `"Authorization"`, the parameter
   *   definition _SHALL_ be ignored.
   * - For all other cases, the `name` corresponds to the parameter name
   *   used by the {@link ParameterObject.in `in`} field.
   */
  readonly name: string;

  /**
   * The location of the parameter. Possible values are `"query"`,
   * `"header"`, `"path"`, or `"cookie"`.
   */
  readonly in: "query" | "header" | "path" | "cookie";

  /**
   * A brief description of the parameter. This could contain examples of
   * use. [CommonMark](https://spec.commonmark.org/) syntax _MAY_ be used
   * for rich text representation.
   */
  readonly description?: string;

  /**
   * Determines whether this parameter is mandatory. If the parameter
   * {@link ParameterObject.in location} is `"path"`, this field is
   * ___REQUIRED___ and its value _MUST_ be `true`. Otherwise, the field
   * _MAY_ be included and its default value is `false`.
   */
  readonly required?: boolean;

  /**
   * Specifies that a parameter is deprecated and _SHOULD_ be transitioned
   * out of usage. Default value is `false`.
   */
  readonly deprecated?: boolean;

  /**
   * If `true`, clients _MAY_ pass a zero-length string value in place of
   * parameters that would otherwise be omitted entirely, which the server
   * _SHOULD_ interpret as the parameter being unused. Default value is
   * `false`. If {@link ParameterObject.style `style`} is used, and if
   * behavior is n/a (cannot be serialized), the value of `allowEmptyValue`
   * _SHALL_ be ignored. Interactions between this field and the parameter's
   * {@link SchemaObject Schema Object} are implementation-defined. This field
   * is valid only for `query` parameters. Use of this field is _NOT
   * RECOMMENDED_, and it is likely to be removed in a later revision.
   */
  readonly allowEmptyValue?: boolean;

  /**
   * Describes how the parameter value will be serialized depending on the
   * type of the parameter value. Default values (based on value of `in`):
   *
   * - for `"query"` - `"form"`;
   * - for `"path"` - `"simple"`;
   * - for `"header"` - `"simple"`;
   * - for `"cookie"` - `"form"`.
   */
  readonly style?: string;

  /**
   * When this is `true`, parameter values of type `array` or `object`
   * generate separate parameters for each value of the array or key-value
   * pair of the map. For other types of parameters this field has no effect.
   * When {@link ParameterObject.style `style`} is `"form"`, the default
   * value is `true`. For all other styles, the default value is `false`.
   * Note that despite `false` being the default for `deepObject`,
   * the combination of `false` with `deepObject` is undefined.
   */
  readonly explode?: boolean;

  /**
   * When this is `true`, parameter values are serialized using reserved
   * expansion, as defined by [RFC6570](
   * https://www.rfc-editor.org/rfc/rfc6570) [Section 3.2.3](
   * https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3),
   * which allows [RFC3986's reserved character set](
   * https://tools.ietf.org/html/rfc3986#section-2.2), as well as
   * percent-encoded triples, to pass through unchanged, while still
   * percent-encoding all other disallowed characters (including `%` outside
   * of percent-encoded triples). Applications are still responsible for
   * percent-encoding reserved characters that are [not allowed in the query
   * string](https://tools.ietf.org/html/rfc3986#section-3.4) (`[`, `]`, `#`),
   * or have a special meaning in `application/x-www-form-urlencoded`
   * (`-`, `&amp;`, `+`). This field only applies to parameters with an
   * `in` value of `query`. The default value is `false`.
   */
  readonly allowReserved?: boolean;

  /**
   * The schema defining the type used for the parameter.
   */
  readonly schema?: SchemaObject;

  /**
   * Example of the parameter's potential value.
   */
  readonly example?: unknown;

  /**
   * Examples of the parameter's potential value.
   */
  readonly examples?: {
    readonly [name: string]: ExampleObject | ReferenceObject;
  };

  /**
   * A map containing the representations for the parameter. The key is
   * the media type and the value describes it. The map _MUST_ only contain
   * one entry.
   */
  readonly content?: { readonly [mediaType: string]: MediaTypeObject };
}

/** @internal */
export function parseParameterReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseParameterObject);
}

/** @internal */
export function parseParameterObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Parameter Object",
    parseParameterField,
  );
}

/** @internal */
function parseParameterField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "name":
      parser.parseString(context, parser, value, key);
      break;
    case "in":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "required":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "deprecated":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "allowEmptyValue":
      parser.parseBoolean(context, parser, value, key);
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
      parser.parseExtension(context, "Parameter Object", key, value);
  }
}
