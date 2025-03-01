import { expandUriTemplate } from "tool-uri";
import { isObject, treeShakeReferences } from "tool-json";
import { ApiError } from "../error.ts";
import type * as OpenApi31 from "../3.1/mod.ts";
import type { ApiOperation } from "../api.ts";

/**
 * Options for generating a Tool Handle request for an OpenAPI operation.
 *
 * @category Handle
 */
export interface ApiHandleRequestOptions {
  /**
   * The server URL to use for the request.
   */
  server?: OpenApi31.ServerObject | undefined;

  /**
   * An additional transformation to apply when rewriting JSON Schema nodes.
   */
  transform?: ((node: unknown) => unknown) | undefined;
}

/**
 * A Tool Handle request for an OpenAPI operation.
 *
 * @category Handle
 */
export interface ApiHandleRequest {
  /**
   * The JSON Schema for all request parameters.
   */
  parameters: object;

  /**
   * The Tool Form template for the request.
   */
  request: {
    /**
     * The HTTP method for the request.
     */
    method: string;

    /**
     * The Tool Form template for the request URL.
     */
    url: unknown;

    /**
     * The Tool Form templates for the request headers.
     */
    headers?: Record<string, unknown>;

    /**
     * The Tool Form template for the request body.
     */
    body?: unknown;
  };
}

/**
 * Generates the request-side of a Tool Handle for an OpenAPI operation.
 *
 * @category Handle
 */
export function generateApiHandleRequest(
  operation: ApiOperation,
  options?: ApiHandleRequestOptions,
): ApiHandleRequest {
  // Declare parameters schema variables.
  let properties: Record<string, unknown> | undefined;
  let required: string[] | undefined;

  // Define request template components.
  let query: Record<string, unknown> | undefined;
  let headers: Record<string, unknown> | undefined;
  let cookies: Record<string, unknown> | undefined;
  let body: object | undefined;

  // Tree-shaking book-keeping.
  const paramIndex: Record<string, number> = {};
  const schemaRoots: object[] = [];

  // Extract parameter schemas.
  for (const parameter of operation.allParameters) {
    let parameterSchema = parameter.schema;
    if (!isObject(parameterSchema)) {
      continue;
    }

    // Parameter description takes precedence over schema description.
    if (parameter.description !== undefined) {
      parameterSchema = {
        ...parameterSchema,
        description: parameter.description,
      };
    }

    if (parameter.in === "query") {
      query ??= {};
      query[parameter.name!] = { $: parameter.name };
    } else if (parameter.in === "header") {
      headers ??= {};
      headers[parameter.name!] = { $: parameter.name };
    } else if (parameter.in === "path") {
      // Already accounted for in the URL template.
    } else if (parameter.in === "cookie") {
      cookies ??= {};
      cookies[parameter.name!] = { $: parameter.name };
    }

    if (parameter.required === true) {
      required ??= [];
      required.push(parameter.name!);
    }
    paramIndex[parameter.name!] = schemaRoots.length;
    schemaRoots.push(parameterSchema);
  }

  // Extract the request body schema and construct the body template.
  const requestBody = operation.requestBody;
  if (requestBody !== undefined) {
    let bodyKey = "body";
    let index = 1;
    while (paramIndex[bodyKey] !== undefined) {
      bodyKey = "body" + String(index);
      index += 1;
    }

    for (const contentType of requestBody.content) {
      let contentSchema = contentType.schema;
      if (!isObject(contentSchema)) {
        continue;
      }

      // Request body description takes precedence over schema description.
      if (requestBody.description !== undefined) {
        contentSchema = {
          ...contentSchema,
          description: requestBody.description,
        };
      }

      const mediaType = contentType.mediaType;
      if (mediaType === "application/json") {
        body = {
          $: bodyKey,
          encode: "json",
        };
      } else if (mediaType === "application/x-www-form-urlencoded") {
        body = {
          $: bodyKey,
          encode: "urlencoded",
        };
      } else if (mediaType === "multipart/form-data") {
        body = {
          $: bodyKey,
          encode: "multipart",
        };
      } else {
        continue;
      }

      if (requestBody.required === true) {
        required ??= [];
        required.push(bodyKey);
      }
      paramIndex[bodyKey] = schemaRoots.length;
      schemaRoots.push(contentSchema);
      break;
    }
  }

  // Tree-shake the request schemas.
  const result = treeShakeReferences(operation.api.context, {
    roots: schemaRoots,
    defsUri: "#/$defs",
    transform: options?.transform,
  });

  // Construct the parameters schema properties.
  for (const [name, index] of Object.entries(paramIndex)) {
    properties ??= {};
    properties[name] = result.roots[index]!;
  }

  // Select the server to use.
  let server = options?.server;
  if (server === undefined) {
    const servers =
      operation.servers ?? operation.pathItem.servers ?? operation.api.servers;
    if (servers === undefined || servers.length === 0) {
      throw new ApiError("No servers defined for operation");
    }
    server = servers[0]!;
  }

  // Expand the server URL.
  let serverUrl: string;
  if (server.variables !== undefined) {
    serverUrl = expandUriTemplate(server.url, (varname) => {
      return server.variables![varname]?.default;
    });
  } else {
    serverUrl = server.url;
  }

  let url = serverUrl + operation.path;
  if (query !== undefined) {
    let vars = "";
    for (const name of Object.keys(query)) {
      if (vars.length !== 0) {
        vars += ",";
      }
      vars += name;
    }
    if (url.includes("?")) {
      url += "{&" + vars + "}";
    } else {
      url += "{?" + vars + "}";
    }
  }

  // Assemble the Tool Handle request template.
  return {
    parameters: {
      type: "object",
      ...(properties !== undefined ? { properties } : {}),
      ...(required !== undefined ? { required } : {}),
      ...(result.defs !== undefined ? { $defs: result.defs } : {}),
    },
    request: {
      method: operation.method,
      url: { $uri: url },
      ...(headers !== undefined ? { headers } : {}),
      //...(cookies !== undefined ? { cookies } : {}),
      ...(body !== undefined ? { body } : {}),
    },
  };
}
