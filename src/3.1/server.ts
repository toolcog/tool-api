import type { ApiContext } from "../context.ts";
import type { SchemaObject } from "./schema.ts";
import type { ApiParser } from "./parser.ts";

/**
 * An object representing a Server.
 *
 * @see [OpenAPI Specification §4.8.5](https://spec.openapis.org/oas/v3.1.1.html#server-object)
 */
export interface ServerObject {
  /**
   * A URL to the target host. This URL supports Server Variables and _MAY_
   * be relative, to indicate that the host location is relative to the
   * location where the document containing the Server Object is being
   * served. Variable substitutions will be made when a variable is named
   * in `{braces}`.
   */
  readonly url: string;

  /**
   * An optional string describing the host designated by the URL.
   * [CommonMark](https://spec.commonmark.org/) syntax _MAY_ be used
   * for rich text representation.
   */
  readonly description?: string;

  /**
   * A map between a variable name and its value. The value is used for
   * substitution in the server's URL template.
   */
  readonly variables?: { readonly [key: string]: ServerVariableObject };
}

/** @internal */
export function parseServerObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(context, parser, node, "Server Object", parseServerField);
}

/** @internal */
function parseServerField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "url":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "variables":
      parser.parseObject(
        context,
        parser,
        value,
        "variables",
        parser.parseServerVariableObject,
      );
      break;
    default:
      parser.parseExtension(context, "Server Object", key, value);
  }
}

/**
 * An object representing a Server Variable for server URL template
 * substitution.
 *
 * @see [OpenAPI Specification §4.8.6](https://spec.openapis.org/oas/v3.1.1.html#server-variable-object)
 */
export interface ServerVariableObject {
  /**
   * An enumeration of string values to be used if the substitution options
   * are from a limited set. The array _MUST NOT_ be empty.
   */
  readonly enum?: readonly string[];

  /**
   * The default value to use for substitution, which _SHALL_ be sent if
   * an alternate value is not supplied. If the `enum` is defined, the value
   * _MUST_ exist in the enum's values. Note that this behavior is different
   * from the {@link SchemaObject Schema Object's} `default` keyword, which
   * documents the receiver's behavior rather than inserting the value
   * into the data.
   */
  readonly default: string;

  /**
   * An optional description for the server variable. [CommonMark](
   * https://spec.commonmark.org/) syntax _MAY_ be used for rich text
   * representation.
   */
  readonly description?: string;
}

/** @internal */
export function parseServerVariableObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Server Variable Object",
    parseServerVariableField,
  );
}

/** @internal */
function parseServerVariableField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "enum":
      parser.parseArray(context, parser, value, key, parser.parseString);
      break;
    case "default":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "Server Variable Object", key, value);
  }
}
