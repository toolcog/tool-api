import type { Uri } from "tool-uri";
import { parseUriReference, resolveUri } from "tool-uri";
import {
  isObject,
  currentFrame,
  currentBaseUri,
  currentLocation,
  registerReference,
} from "tool-json";
import { ApiError } from "../error.ts";
import type { ApiContext } from "../context.ts";
import type { ApiParser } from "./parser.ts";

/**
 * A simple object to allow referencing other components in the OpenAPI
 * Description, internally and externally.
 *
 * The `$ref` string value contains a URI [RFC3986](
 * https://www.rfc-editor.org/rfc/rfc3986),
 * which identifies the value being referenced.
 *
 * See the rules for resolving [Relative References](
 * https://spec.openapis.org/oas/v3.1.1.html#relative-references-in-api-description-uris).
 *
 * @see [OpenAPI Specification §4.8.23](https://spec.openapis.org/oas/v3.1.1.html#reference-object)
 */
export interface ReferenceObject {
  /**
   * The reference identifier. This _MUST_ be in the form of a URI.
   */
  readonly $ref: string;

  /**
   * A short summary which by default _SHOULD_ override that of the
   * referenced component. If the referenced object-type does not allow a
   * `summary` field, then this field has no effect.
   */
  readonly summary?: string;

  /**
   * A description which by default _SHOULD_ override that of the referenced
   * component. [CommonMark](https://spec.commonmark.org/) syntax _MAY_ be
   * used for rich text representation. If the referenced object-type does
   * not allow a `description` field, then this field has no effect.
   */
  readonly description?: string;
}

/** @internal */
export function parseReferenceObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
  parseValue: (context: ApiContext, parser: ApiParser, value: unknown) => void,
): void {
  if (!isObject(node) || !("$ref" in node)) {
    parseValue(context, parser, node);
    return;
  }

  parser.parseObject(
    context,
    parser,
    node,
    "Reference Object",
    parseReferenceField,
  );
}

/** @internal */
export function parseReferenceField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "$ref": {
      const frame = currentFrame(context);

      parser.parseString(context, parser, value, key);

      // §4.8.9.1: The value MUST be in the form of a URI.
      let refUri: Uri;
      try {
        refUri = parseUriReference(value as string);
      } catch (cause) {
        throw new ApiError('"$ref" must be a valid URI reference', {
          location: currentLocation(context),
          cause,
        });
      }

      // §4.6: URIs MAY be relative references.
      refUri = resolveUri(currentBaseUri(frame), refUri);

      // Get the stack frame associated with the path item.
      const pathItemFrame = frame.parent;
      if (!isObject(pathItemFrame?.node)) {
        throw new ApiError("Unknown Path Item Object", {
          location: currentLocation(context),
        });
      }

      // Register the reference for eventual resolution.
      registerReference(context, pathItemFrame.node, "$ref", refUri.href);
      break;
    }
    case "summary":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    default:
    // §4.8.23.1: This object cannot be extended with additional properties,
    // and any properties added SHALL be ignored.
  }
}
