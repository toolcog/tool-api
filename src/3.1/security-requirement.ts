import type { ApiContext } from "../context.ts";
import type { OpenApiObject } from "./openapi.ts";
import type { ComponentsObject } from "./components.ts";
import type { OperationObject } from "./operation.ts";
import type { SecuritySchemeObject } from "./security-scheme.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Lists the required security schemes to execute this operation. The name
 * used for each property _MUST_ correspond to a security scheme declared
 * in the {@link SecuritySchemeObject Security Schemes} under the
 * {@link ComponentsObject Components} Object.
 *
 * A Security Requirement Object _MAY_ refer to multiple security schemes in
 * which case all schemes _MUST_ be satisfied for a request to be authorized.
 * This enables support for scenarios where multiple query parameters or HTTP
 * headers are required to convey security information.
 *
 * When the `security` field is defined on the
 * {@link OpenApiObject OpenAPI Object} or
 * {@link OperationObject Operation Object} and contains multiple Security
 * Requirement Objects, only one of the entries in the list needs to be
 * satisfied to authorize the request. This enables support for scenarios
 * where the API allows multiple, independent security schemes.
 *
 * An empty Security Requirement Object (`{}`) indicates anonymous access
 * is supported.
 *
 * @see [OpenAPI Specification §4.8.30](https://spec.openapis.org/oas/v3.1.1.html#security-requirement-object)
 */
export interface SecurityRequirementObject {
  /**
   * Each name _MUST_ correspond to a security scheme which is declared
   * in the {@link SecuritySchemeObject Security Schemes} under the
   * {@link ComponentsObject Components} Object. If the security scheme is
   * of type `"oauth2"` or `"openIdConnect"`, then the value is a list of
   * scope names required for the execution, and the list _MAY_ be empty if
   * authorization does not require a specified scope. For other security
   * scheme types, the array _MAY_ contain a list of role names which are
   * required for the execution, but are not otherwise defined or exchanged
   * in-band.
   */
  readonly [name: string]: readonly string[];
}

/** @internal */
export function parseSecurityRequirementObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Security Requirement Object",
    parseSecurityRequirementField,
  );
}

/** @internal */
function parseSecurityRequirementField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  parser.parseArray(context, parser, value, key, parser.parseString);
}
