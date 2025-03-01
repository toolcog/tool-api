import type { ApiContext } from "../context.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Allows configuration of the supported OAuth Flows.
 *
 * @see [OpenAPI Specification §4.8.28](https://spec.openapis.org/oas/v3.1.1.html#oauth-flows-object)
 */
export interface OAuthFlowsObject {
  /**
   * Configuration for the OAuth Implicit flow.
   */
  readonly implicit?: OAuthFlowObject;

  /**
   * Configuration for the OAuth Resource Owner Password flow.
   */
  readonly password?: OAuthFlowObject;

  /**
   * Configuration for the OAuth Client Credentials flow. Previously called
   * `application` in OpenAPI 2.0.
   */
  readonly clientCredentials?: OAuthFlowObject;

  /**
   * Configuration for the OAuth Authorization Code flow. Previously called
   * `accessCode` in OpenAPI 2.0.
   */
  readonly authorizationCode?: OAuthFlowObject;
}

/** @internal */
export function parseOAuthFlowsObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "OAuth Flows Object",
    parseOAuthFlowsField,
  );
}

/** @internal */
function parseOAuthFlowsField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "implicit":
      parser.parseOAuthFlowObject(context, parser, value);
      break;
    case "password":
      parser.parseOAuthFlowObject(context, parser, value);
      break;
    case "clientCredentials":
      parser.parseOAuthFlowObject(context, parser, value);
      break;
    case "authorizationCode":
      parser.parseOAuthFlowObject(context, parser, value);
      break;
    default:
      parser.parseExtension(context, "OAuth Flows Object", key, value);
  }
}

/**
 * Configuration details for a supported OAuth Flow.
 *
 * @see [OpenAPI Specification §4.8.29](https://spec.openapis.org/oas/v3.1.1.html#oauth-flow-object)
 */
export interface OAuthFlowObject {
  /**
   * The authorization URL to be used for this flow. This _MUST_ be in the
   * form of a URL. The OAuth2 standard requires the use of TLS.
   */
  readonly authorizationUrl?: string;

  /**
   * The token URL to be used for this flow. This _MUST_ be in the form
   * of a URL. The OAuth2 standard requires the use of TLS.
   */
  readonly tokenUrl?: string;

  /**
   * The URL to be used for obtaining refresh tokens. This _MUST_ be in the
   * form of a URL. The OAuth2 standard requires the use of TLS.
   */
  readonly refreshUrl?: string;

  /**
   * The available scopes for the OAuth2 security scheme. A map between the
   * scope name and a short description for it. The map _MAY_ be empty.
   */
  readonly scopes?: { readonly [key: string]: string };
}

/** @internal */
export function parseOAuthFlowObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "OAuth Flow Object",
    parseOAuthFlowField,
  );
}

/** @internal */
function parseOAuthFlowField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "authorizationUrl":
      parser.parseString(context, parser, value, key);
      break;
    case "tokenUrl":
      parser.parseString(context, parser, value, key);
      break;
    case "refreshUrl":
      parser.parseString(context, parser, value, key);
      break;
    case "scopes":
      parser.parseObject(context, parser, value, key, parser.parseString);
      break;
    default:
      parser.parseExtension(context, "OAuth Flow Object", key, value);
  }
}
