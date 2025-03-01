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
import type { OpenApiObject } from "./openapi.ts";
import type { ServerObject } from "./server.ts";
import type { ComponentsObject } from "./components.ts";
import type { OperationObject } from "./operation.ts";
import type { ParameterObject } from "./parameter.ts";
import type { ReferenceObject } from "./reference.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Holds the relative paths to the individual endpoints and their operations.
 * The path is appended to the URL from the {@link ServerObject Server Object}
 * in order to construct the full URL. The Paths Object _MAY_ be empty,
 * due to [Access Control List (ACL) constraints](
 * https://spec.openapis.org/oas/v3.1.1.html#security-filtering).
 *
 * @see [OpenAPI Specification §4.8.8](https://spec.openapis.org/oas/v3.1.1.html#paths-object)
 */
export interface PathsObject {
  /**
   * A relative path to an individual endpoint. The field name _MUST_ begin
   * with a forward slash (`/`). The path is __appended__ (no relative URL
   * resolution) to the expanded URL from the
   * {@link ServerObject Server Object's} `url` field in order to construct
   * the full URL.
   * [Path templating](https://spec.openapis.org/oas/v3.1.1.html#path-templating)
   * is allowed. When matching URLs, concrete (non-templated) paths would be
   * matched before their templated counterparts. Templated paths with the
   * same hierarchy but different templated names _MUST NOT_ exist as they
   * are identical. In case of ambiguous matching, it's up to the tooling
   * to decide which one to use.
   */
  readonly [template: string]: PathItemObject;
}

/** @internal */
export function parsePathsObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(context, parser, node, "Paths Object", parsePathsField);
}

/** @internal */
function parsePathsField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  if (key.startsWith("x-")) {
    parser.parseExtension(context, "Paths Object", key, value);
  }
  parser.parsePathItemObject(context, parser, value);
}

/**
 * Describes the operations available on a single path. A Path Item _MAY_
 * be empty, due to [ACL constraints](
 * https://spec.openapis.org/oas/v3.1.1.html#security-filtering). The path
 * itself is still exposed to the documentation viewer but they will not
 * know which operations and parameters are available.
 *
 * @see [OpenAPI Specification §4.8.9](https://spec.openapis.org/oas/v3.1.1.html#path-item-object)
 */
export interface PathItemObject {
  /**
   * Allows for a referenced definition of this path item. The value _MUST_
   * be in the form of a URI, and the referenced structure _MUST_ be in the
   * form of a {@link PathItemObject Path Item Object}. In case a Path Item
   * Object field appears both in the defined object and the referenced object,
   * the behavior is undefined.
   */
  readonly $ref?: string;

  /**
   * An optional string summary, intended to apply to all operations
   * in this path.
   */
  readonly summary?: string;

  /**
   * An optional string description, intended to apply to all operations in
   * this path. [CommonMark](https://spec.commonmark.org/) syntax _MAY_ be
   * used for rich text representation.
   */
  readonly description?: string;

  /**
   * A definition of a GET operation on this path.
   */
  readonly get?: OperationObject;

  /**
   * A definition of a PUT operation on this path.
   */
  readonly put?: OperationObject;

  /**
   * A definition of a POST operation on this path.
   */
  readonly post?: OperationObject;

  /**
   * A definition of a DELETE operation on this path.
   */
  readonly delete?: OperationObject;

  /**
   * A definition of an OPTIONS operation on this path.
   */
  readonly options?: OperationObject;

  /**
   * A definition of a HEAD operation on this path.
   */
  readonly head?: OperationObject;

  /**
   * A definition of a PATCH operation on this path.
   */
  readonly patch?: OperationObject;

  /**
   * A definition of a TRACE operation on this path.
   */
  readonly trace?: OperationObject;

  /**
   * An alternative `servers` array to service all operations in this path.
   * If a `servers` array is specified at the
   * {@link OpenApiObject.servers OpenAPI Object} level, it will be overridden
   * by this value.
   */
  readonly servers?: readonly ServerObject[];

  /**
   * A list of parameters that are applicable for all the operations
   * described under this path. These parameters can be overridden at
   * the operation level, but cannot be removed there. The list _MUST NOT_
   * include duplicated parameters. A unique parameter is defined by
   * a combination of a {@link ParameterObject.name name} and
   * {@link ParameterObject.in location}. The list can use the
   * {@link ReferenceObject Reference Object} to link to parameters
   * that are defined in the
   * {@link ComponentsObject.parameters OpenAPI Object's `components.parameters`}.
   */
  readonly parameters?: readonly (ParameterObject | ReferenceObject)[];
}

/** @internal */
export function parsePathItemObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Path Item Object",
    parsePathItemField,
  );
}

/** @internal */
function parsePathItemField(
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
    case "get":
      parser.parseOperationObject(context, parser, value);
      break;
    case "put":
      parser.parseOperationObject(context, parser, value);
      break;
    case "post":
      parser.parseOperationObject(context, parser, value);
      break;
    case "delete":
      parser.parseOperationObject(context, parser, value);
      break;
    case "options":
      parser.parseOperationObject(context, parser, value);
      break;
    case "head":
      parser.parseOperationObject(context, parser, value);
      break;
    case "patch":
      parser.parseOperationObject(context, parser, value);
      break;
    case "trace":
      parser.parseOperationObject(context, parser, value);
      break;
    case "servers":
      parser.parseArray(context, parser, value, key, parser.parseServerObject);
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
    default:
      parser.parseExtension(context, "Path Item Object", key, value);
  }
}
