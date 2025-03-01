import type { ApiContext } from "../context.ts";
import type { ApiParser } from "./parser.ts";

/**
 * License information for the exposed API.
 *
 * @see [OpenAPI Specification §4.8.4](https://spec.openapis.org/oas/v3.1.1.html#license-object)
 */
export interface LicenseObject {
  /**
   * The license name used for the API.
   */
  readonly name: string;

  /**
   * An [SPDX-Licenses](https://spdx.org/licenses/) expression for the API.
   * The `identifier` field is mutually exclusive of the `url` field.
   */
  readonly identifier?: string;

  /**
   * A URI for the license used for the API. This _MUST_ be in the form of
   * a URI. The `url` field is mutually exclusive of the `identifier` field.
   */
  readonly url?: string;
}

/** @internal */
export function parseLicenseObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "License Object",
    parseLicenseField,
  );
}

/** @internal */
function parseLicenseField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "name":
      parser.parseString(context, parser, value, key);
      break;
    case "identifier":
      parser.parseString(context, parser, value, key);
      break;
    case "url":
      parser.parseString(context, parser, value, key);
      break;
    default:
      parser.parseExtension(context, "License Object", key, value);
  }
}
