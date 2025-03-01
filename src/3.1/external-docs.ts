import type { ApiContext } from "../context.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Allows referencing an external resource for extended documentation.
 *
 * @see [OpenAPI Specification §4.8.11](https://spec.openapis.org/oas/v3.1.1.html#external-documentation-object)
 */
export interface ExternalDocsObject {
  /**
   * A description of the target documentation. [CommonMark](
   * https://spec.commonmark.org/) syntax _MAY_ be used for rich text
   * representation.
   */
  readonly description?: string;

  /**
   * The URI for the target documentation. This _MUST_ be in the form
   * of a URI.
   */
  readonly url: string;
}

/** @internal */
export function parseExternalDocsObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "External Documentation Object",
    parseExternalDocsField,
  );
}

/** @internal */
function parseExternalDocsField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "url":
      parser.parseString(context, parser, value, key);
      break;
    default:
      parser.parseExtension(
        context,
        "External Documentation Object",
        key,
        value,
      );
  }
}
