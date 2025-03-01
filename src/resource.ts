import { isValidUri } from "tool-uri";
import type { Resource } from "tool-json";
import {
  isObject,
  currentFrame,
  currentLocation,
  createResource,
  getResource,
  setResource,
} from "tool-json";
import type { Dialect } from "tool-schema";
import { dialect05, dialectOas31 } from "tool-schema";
import { ApiError } from "./error.ts";
import type { ApiContext } from "./context.ts";

/**
 * An OpenAPI resource
 *
 * @category Resource
 */
export interface ApiResource extends Resource {}

/**
 * Returns `true` if the given resource is an OpenAPI resource.
 *
 * @category Resource
 */
export function isApiResource(
  resource:
    | (Resource & { [K in keyof ApiResource]?: ApiResource[K] | undefined })
    | undefined,
): resource is ApiResource {
  return resource !== undefined;
}

/**
 * Initializes a JSON resource as an OpenAPI resource.
 *
 * @category Resource
 */
export function initApiResource(
  resource: Resource & Partial<ApiResource>,
): ApiResource {
  return resource as ApiResource;
}

/**
 * Parses the node at the top of the stack as an OpenAPI document.
 *
 * @throws ApiError if the node is not a valid OpenAPI document.
 * @category Resource
 * @internal
 */
export function parseApiResource(context: ApiContext): ApiResource | undefined {
  // Get the document node from the top of the stack.
  const frame = currentFrame(context);
  const node = frame.node;

  // Ensure the document is an object.
  if (!isObject(node)) {
    throw new ApiError("OpenAPI document must be an object", {
      location: currentLocation(context),
    });
  }

  // Get the stack frame associated with the document node.
  let resource = getResource(context, node) as ApiResource | undefined;
  if (isApiResource(resource)) {
    // The node has already been parsed as an OpenAPI resource.
    return resource;
  }
  // Create and register a new JSON resource, if one doesn't already exist.
  if (resource === undefined) {
    resource = createResource(undefined, node) as ApiResource;
    setResource(context, resource);
  }
  // Initialize the JSON resource as an OpenAPI resource.
  initApiResource(resource);

  // Use the OpenAPI parser from the context.
  const parser = context.apiParser;
  if (parser === undefined) {
    throw new ApiError("No OpenAPI parser", {
      location: currentLocation(context),
    });
  }

  // Save the current default JSON Schema dialect.
  const parentDialect = context.dialect;

  // Determine the default JSON Schema dialect used by the document.
  const dialectUri = node.jsonSchemaDialect;
  let dialect: Dialect | undefined;
  if (dialectUri !== undefined) {
    if (typeof dialectUri !== "string") {
      throw new ApiError("jsonSchemaDialect must be a string", {
        location: currentLocation(context),
      });
    }

    if (!isValidUri(dialectUri)) {
      throw new ApiError("jsonSchemaDialect must be a valid URI", {
        location: currentLocation(context),
      });
    }

    dialect = context.dialects?.get(dialectUri);
    if (dialect === undefined) {
      throw new ApiError(
        "Unknown JSON Schema dialect " + JSON.stringify(dialectUri),
        { location: currentLocation(context) },
      );
    }
    context.dialect = dialect;
  } else if (
    context.dialect === undefined &&
    typeof node.openapi === "string" &&
    node.openapi.startsWith("3.1")
  ) {
    context.dialect = dialectOas31;
  } else if (context.dialect === undefined) {
    context.dialect = dialect05;
  }

  // Parse the OpenAPI object.
  try {
    parser.parseOpenApiObject(context, parser, node);
  } finally {
    // Restore the original JSON Schema dialect.
    context.dialect = parentDialect;
  }

  return resource;
}
