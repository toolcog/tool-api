import type { ApiContext } from "../context.ts";
import type { ReferenceObject } from "./reference.ts";
import type { ApiParser } from "./parser.ts";

export type ExamplesObject = {
  readonly [name: string]: ExampleObject | ReferenceObject;
};

/**
 * An object grouping an internal or external example value with basic
 * `summary` and `description` metadata. This object is typically used
 * in fields named `examples` (plural), and is a
 * {@link ReferenceObject referenceable} alternative to older `example`
 * (singular) fields that do not support referencing or metadata.
 *
 * Examples allow demonstration of the usage of properties, parameters
 * and objects within OpenAPI.
 *
 * @see [OpenAPI Specification §4.8.19](https://spec.openapis.org/oas/v3.1.1.html#example-object)
 */
export interface ExampleObject {
  /**
   * Short description for the example.
   */
  readonly summary?: string;

  /**
   * Long description for the example. [CommonMark](
   * https://spec.commonmark.org/) syntax _MAY_ be used for rich text
   * representation.
   */
  readonly description?: string;

  /**
   * Embedded literal example. The `value` field and `externalValue` field
   * are mutually exclusive. To represent examples of media types that
   * cannot naturally represented in JSON or YAML, use a string value
   * to contain the example, escaping where necessary.
   */
  readonly value?: unknown;

  /**
   * A URI that identifies the literal example. This provides the capability
   * to reference examples that cannot easily be included in JSON or YAML
   * documents. The `value` field and `externalValue` field are mutually
   * exclusive. See the rules for resolving [Relative References](
   * https://spec.openapis.org/oas/v3.1.1.html#relative-references-in-api-description-uris).
   */
  readonly externalValue?: string;
}

/** @internal */
export function parseExampleReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseExampleObject);
}

/** @internal */
export function parseExampleObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Example Object",
    parseExampleField,
  );
}

/** @internal */
function parseExampleField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "summary":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "value":
      break;
    case "externalValue":
      parser.parseString(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "Example Object", key, value);
  }
}
