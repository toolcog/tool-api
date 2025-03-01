import type { ApiContext } from "../context.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Contact information for the exposed API.
 *
 * @see [OpenAPI Specification §4.8.3](https://spec.openapis.org/oas/v3.1.1.html#contact-object)
 */
export interface ContactObject {
  /**
   * The identifying name of the contact person/organization.
   */
  readonly name?: string;

  /**
   * The URI for the contact information. This _MUST_ be in the form of a URI.
   */
  readonly url?: string;

  /**
   * The email address of the contact person/organization. This _MUST_ be in
   * the form of an email address.
   */
  readonly email?: string;
}

/** @internal */
export function parseContactObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Contact Object",
    parseContactField,
  );
}

/** @internal */
function parseContactField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "name":
      parser.parseString(context, parser, value, key);
      break;
    case "url":
      parser.parseString(context, parser, value, key);
      break;
    case "email":
      parser.parseString(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "Contact Object", key, value);
  }
}
