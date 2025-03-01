import type { ApiContext } from "../context.ts";
import type { ContactObject } from "./contact.ts";
import type { LicenseObject } from "./license.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Metadata about the API.
 *
 * @see [OpenAPI Specification §4.8.2](https://spec.openapis.org/oas/v3.1.1.html#info-object)
 */
export interface InfoObject {
  /**
   * The title of the API.
   */
  readonly title: string;

  /**
   * A short summary of the API.
   */
  readonly summary?: string;

  /**
   * A description of the API. [CommonMark](https://spec.commonmark.org/)
   * syntax _MAY_ be used for rich text representation.
   */
  readonly description?: string;

  /**
   * A URI for the Terms of Service for the API. This _MUST_ be in the form
   * of a URI.
   */
  readonly termsOfService?: string;

  /**
   * The contact information for the exposed API.
   */
  readonly contact?: ContactObject;

  /**
   * The license information for the exposed API.
   */
  readonly license?: LicenseObject;

  /**
   * The version of the OpenAPI Document (which is distinct from the
   * [OpenAPI Specification version](
   * https://spec.openapis.org/oas/v3.1.1.html#oas-version) or the version
   * of the API being described or the version of the OpenAPI Description).
   */
  readonly version: string;
}

/** @internal */
export function parseInfoObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(context, parser, node, "Info Object", parseInfoField);
}

/** @internal */
function parseInfoField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "title":
      parser.parseString(context, parser, value, key);
      break;
    case "summary":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "termsOfService":
      parser.parseString(context, parser, value, key);
      break;
    case "contact":
      parser.parseContactObject(context, parser, value);
      break;
    case "license":
      parser.parseLicenseObject(context, parser, value);
      break;
    case "version":
      parser.parseString(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "Info Object", key, value);
  }
}
