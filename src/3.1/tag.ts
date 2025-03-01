import type { ApiContext } from "../context.ts";
import type { OperationObject } from "./operation.ts";
import type { ExternalDocsObject } from "./external-docs.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Adds metadata to a single tag that is used by the
 * {@link OperationObject Operation Object}. It is not mandatory to have
 * a Tag Object per tag defined in the Operation Object instances.
 *
 * @see [OpenAPI Specification §4.8.22](https://spec.openapis.org/oas/v3.1.1.html#tag-object)
 */
export interface TagObject {
  /**
   * The name of the tag.
   */
  readonly name: string;

  /**
   * A description for the tag. [CommonMark](https://spec.commonmark.org/)
   * syntax _MAY_ be used for rich text representation.
   */
  readonly description?: string;

  /**
   * Additional external documentation for this tag.
   */
  readonly externalDocs?: ExternalDocsObject;
}

/** @internal */
export function parseTagObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(context, parser, node, "Tag Object", parseTagField);
}

/** @internal */
function parseTagField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "name":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "externalDocs":
      parser.parseExternalDocsObject(context, parser, value);
      break;
    default:
      parser.parseExtension(context, "Tag Object", key, value);
  }
}
