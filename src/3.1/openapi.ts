import type { ApiContext } from "../context.ts";
import type { InfoObject } from "./info.ts";
import type { ServerObject } from "./server.ts";
import type { ComponentsObject } from "./components.ts";
import type { PathsObject } from "./path.ts";
import type { PathItemObject } from "./path.ts";
import type { OperationObject } from "./operation.ts";
import type { ExternalDocsObject } from "./external-docs.ts";
import type { TagObject } from "./tag.ts";
import type { SchemaObject } from "./schema.ts";
import type { SecurityRequirementObject } from "./security-requirement.ts";
import type { ApiParser } from "./parser.ts";

/**
 * The root object of an [OpenAPI Description](
 * https://spec.openapis.org/oas/v3.1.1.html#openapi-description).
 *
 * @see [OpenAPI Specification §4.8.1](https://spec.openapis.org/oas/v3.1.1.html#openapi-object)
 */
export interface OpenApiObject {
  /**
   * This string _MUST_ be the [version number](
   * https://spec.openapis.org/oas/v3.1.1.html#versions)
   * of the OpenAPI Specification that the OpenAPI Document uses. The `openapi`
   * field _SHOULD_ be used by tooling to interpret the OpenAPI Document.
   * This is _not_ related to the API [`info.version`](
   * https://spec.openapis.org/oas/v3.1.1.html#info-version) string.
   */
  readonly openapi: string | undefined;

  /**
   * Provides metadata about the API. The metadata _MAY_ be used by tooling
   * as required.
   */
  readonly info: InfoObject | undefined;

  /**
   * The default value for the `$schema` keyword within
   * {@link SchemaObject Schema Objects} contained within this OAS document.
   * This _MUST_ be in the form of a URI.
   */
  readonly jsonSchemaDialect?: string;

  /**
   * An array of Server Objects, which provide connectivity information to
   * a target server. If the `servers` field is not provided, or is an empty
   * array, the default value would be a {@link ServerObject Server Object}
   * with a url value of `/`.
   */
  readonly servers?: readonly ServerObject[];

  /**
   * The available paths and operations for the API.
   */
  readonly paths?: PathsObject;

  /**
   * The incoming webhooks that _MAY_ be received as part of this API and
   * that the API consumer _MAY_ choose to implement. Closely related to the
   * `callbacks` feature, this section describes requests initiated other than
   * by an API call, for example by an out of band registration. The key name
   * is a unique string to refer to each webhook, while the (optionally
   * referenced) Path Item Object describes a request that may be initiated
   * by the API provider and the expected responses.
   */
  readonly webhooks?: { readonly [key: string]: PathItemObject };

  /**
   * An element to hold various Objects for the OpenAPI Description.
   */
  readonly components?: ComponentsObject;

  /**
   * A declaration of which security mechanisms can be used across the API.
   * The list of values includes alternative Security Requirement Objects that
   * can be used. Only one of the Security Requirement Objects need to be
   * satisfied to authorize a request. Individual operations can override this
   * definition. The list can be incomplete, up to being empty or absent.
   * To make security explicitly optional, an empty security requirement (`{}`)
   * can be included in the array.
   */
  readonly security?: readonly SecurityRequirementObject[];

  /**
   * A list of tags used by the OpenAPI Description with additional metadata.
   * The order of the tags can be used to reflect on their order by the parsing
   * tools. Not all tags that are used by the
   * {@link OperationObject Operation Object} must be declared. The tags that
   * are not declared _MAY_ be organized randomly or based on the tools' logic.
   * Each tag name in the list _MUST_ be unique.
   */
  readonly tags?: readonly TagObject[];

  /**
   * Additional external documentation.
   */
  readonly externalDocs?: ExternalDocsObject;
}

/** @internal */
export function parseOpenApiObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "OpenAPI Object",
    parseOpenApiField,
  );
}

/** @internal */
function parseOpenApiField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "openapi":
      parser.parseString(context, parser, value, key);
      break;
    case "info":
      parser.parseInfoObject(context, parser, value);
      break;
    case "jsonSchemaDialect":
      parser.parseString(context, parser, value, key);
      break;
    case "servers":
      parser.parseArray(
        context,
        parser,
        value,
        "servers",
        parser.parseServerObject,
      );
      break;
    case "paths":
      parser.parsePathsObject(context, parser, value);
      break;
    case "webhooks":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parsePathItemObject,
      );
      break;
    case "components":
      parser.parseComponentsObject(context, parser, value);
      break;
    case "security":
      parser.parseArray(
        context,
        parser,
        value,
        "security",
        parser.parseSecurityRequirementObject,
      );
      break;
    case "tags":
      parser.parseArray(context, parser, value, "tags", parser.parseTagObject);
      break;
    case "externalDocs":
      parser.parseExternalDocsObject(context, parser, value);
      break;
    default:
      parser.parseExtension(context, "OpenAPI Object", key, value);
  }
}
