import type { ApiContext } from "../context.ts";
import type { OpenApiObject } from "./openapi.ts";
import type { ServerObject } from "./server.ts";
import type { ComponentsObject } from "./components.ts";
import type { PathItemObject } from "./path.ts";
import type { ExternalDocsObject } from "./external-docs.ts";
import type { ParameterObject } from "./parameter.ts";
import type { RequestBodyObject } from "./request-body.ts";
import type { ResponsesObject } from "./response.ts";
import type { CallbackObject } from "./callback.ts";
import type { ReferenceObject } from "./reference.ts";
import type { SecurityRequirementObject } from "./security-requirement.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Describes a single API operation on a path.
 *
 * @see [OpenAPI Specification §4.8.10](https://spec.openapis.org/oas/v3.1.1.html#operation-object)
 */
export interface OperationObject {
  /**
   * A list of tags for API documentation control. Tags can be used for
   * logical grouping of operations by resources or any other qualifier.
   */
  readonly tags?: readonly string[];

  /**
   * A short summary of what the operation does.
   */
  readonly summary?: string;

  /**
   * A verbose explanation of the operation behavior. [CommonMark](
   * https://spec.commonmark.org/) syntax _MAY_ be used for rich text
   * representation.
   */
  readonly description?: string;

  /**
   * Additional external documentation for this operation.
   */
  readonly externalDocs?: ExternalDocsObject;

  /**
   * Unique string used to identify the operation. The id _MUST_ be unique
   * among all operations described in the API. The operationId value is
   * __case-sensitive__. Tools and libraries _MAY_ use the operationId
   * to uniquely identify an operation, therefore, it is _RECOMMENDED_
   * to follow common programming naming conventions.
   */
  readonly operationId?: string;

  /**
   * A list of parameters that are applicable for this operation.
   * If a parameter is already defined at the {@link PathItemObject Path Item},
   * the new definition will override it but can never remove it. The list
   * _MUST NOT_ include duplicated parameters. A unique parameter is defined
   * by a combination of a {@link ParameterObject.name name} and
   * {@link ParameterObject.in location}. The list can use the
   * {@link ReferenceObject Reference Object} to link to parameters
   * that are defined in the
   * {@link ComponentsObject.parameters OpenAPI Object's `components.parameters`}.
   */
  readonly parameters?: readonly (ParameterObject | ReferenceObject)[];

  /**
   * The request body applicable for this operation. The `requestBody`
   * is fully supported in HTTP methods where the HTTP 1.1 specification
   * [RFC7231](https://spec.openapis.org/oas/v3.1.1.html#bib-rfc7231)
   * [Section 4.3](https://datatracker.ietf.org/doc/html/rfc7231#section-4.3)
   * has explicitly defined semantics for request bodies. In other cases
   * where the HTTP spec is vague (such as GET, HEAD and DELETE),
   * `requestBody` is permitted but does not have well-defined semantics
   * and _SHOULD_ be avoided if possible.
   */
  readonly requestBody?: RequestBodyObject | ReferenceObject;

  /**
   * The list of possible responses as they are returned from executing
   * this operation.
   */
  readonly responses?: ResponsesObject;

  /**
   * A map of possible out-of band callbacks related to the parent operation.
   * The key is a unique identifier for the Callback Object. Each value in the
   * map is a {@link CallbackObject Callback Object} that describes a request
   * that may be initiated by the API provider and the expected responses.
   */
  readonly callbacks?: {
    readonly [key: string]: CallbackObject | ReferenceObject;
  };

  /**
   * Declares this operation to be deprecated. Consumers _SHOULD_ refrain
   * from usage of the declared operation. Default value is `false`.
   */
  readonly deprecated?: boolean;

  /**
   * A declaration of which security mechanisms can be used for this
   * operation. The list of values includes alternative Security Requirement
   * Objects that can be used. Only one of the Security Requirement Objects
   * need to be satisfied to authorize a request. To make security optional,
   * an empty security requirement (`{}`) can be included in the array.
   * This definition overrides any declared top-level
   * {@link OpenApiObject.security `security`}. To remove a top-level security
   * declaration, an empty array can be used.
   */
  readonly security?: readonly SecurityRequirementObject[];

  /**
   * An alternative `servers` array to service this operation. If a `servers`
   * array is specified at the {@link PathItemObject.servers Path Item Object}
   * or {@link OpenApiObject.servers OpenAPI Object} level, it will be
   * overridden by this value.
   */
  readonly servers?: readonly ServerObject[];
}

/** @internal */
export function parseOperationObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Operation Object",
    parseOperationField,
  );
}

/** @internal */
function parseOperationField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "tags":
      parser.parseArray(context, parser, value, key, parser.parseString);
      break;
    case "summary":
      parser.parseString(context, parser, value, key);
      break;
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "externalDocs":
      parser.parseExternalDocsObject(context, parser, value);
      break;
    case "operationId":
      parser.parseString(context, parser, value, key);
      break;
    case "parameters":
      parser.parseArray(
        context,
        parser,
        value,
        key,
        parser.parseParameterReference,
      );
      break;
    case "requestBody":
      parser.parseRequestBodyReference(context, parser, value);
      break;
    case "responses":
      parser.parseResponsesObject(context, parser, value);
      break;
    case "callbacks":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseCallbackReference,
      );
      break;
    case "deprecated":
      parser.parseBoolean(context, parser, value, key);
      break;
    case "security":
      parser.parseArray(
        context,
        parser,
        value,
        key,
        parser.parseSecurityRequirementObject,
      );
      break;
    case "servers":
      parser.parseArray(context, parser, value, key, parser.parseServerObject);
      break;
    default:
      parser.parseExtension(context, "Operation Object", key, value);
  }
}
