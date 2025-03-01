import type { Frame } from "tool-json";
import { isArray, isObject, nestFrame, currentLocation } from "tool-json";
import { ApiError } from "../error.ts";
import type { ApiContext } from "../context.ts";
import { parseOpenApiObject } from "./openapi.ts";
import { parseInfoObject } from "./info.ts";
import { parseContactObject } from "./contact.ts";
import { parseLicenseObject } from "./license.ts";
import { parseServerObject, parseServerVariableObject } from "./server.ts";
import { parseComponentsObject } from "./components.ts";
import { parsePathsObject, parsePathItemObject } from "./path.ts";
import { parseOperationObject } from "./operation.ts";
import { parseExternalDocsObject } from "./external-docs.ts";
import { parseParameterReference, parseParameterObject } from "./parameter.ts";
import {
  parseRequestBodyReference,
  parseRequestBodyObject,
} from "./request-body.ts";
import { parseMediaTypeObject } from "./media-type.ts";
import { parseEncodingObject } from "./encoding.ts";
import {
  parseResponsesObject,
  parseResponseReference,
  parseResponseObject,
} from "./response.ts";
import { parseCallbackReference, parseCallbackObject } from "./callback.ts";
import { parseExampleReference, parseExampleObject } from "./example.ts";
import { parseLinkReference, parseLinkObject } from "./link.ts";
import { parseHeaderReference, parseHeaderObject } from "./header.ts";
import { parseTagObject } from "./tag.ts";
import { parseReferenceObject } from "./reference.ts";
import { parseSchemaObject } from "./schema.ts";
import { parseSecuritySchemeObject } from "./security-scheme.ts";
import { parseOAuthFlowsObject, parseOAuthFlowObject } from "./oauth-flow.ts";
import { parseSecurityRequirementObject } from "./security-requirement.ts";

/** @internal */
function parseExtension(
  context: ApiContext,
  name: string,
  key: string,
  value: unknown,
): void {
  if (!key.startsWith("x-")) {
    throw new ApiError(
      "Unknown " + name + " property: " + JSON.stringify(key),
      { location: currentLocation(context) },
    );
  }
}

/** @internal */
function parseBoolean(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  if (typeof value !== "boolean") {
    throw new ApiError((key ?? "value") + " must be a boolean", {
      location: currentLocation(context),
    });
  }
}

/** @internal */
function parseString(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string | number | undefined,
): void {
  if (typeof value !== "string") {
    throw new ApiError((key ?? "value") + " must be a string", {
      location: currentLocation(context),
    });
  }
}

/** @internal */
function parseArray(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
  name: string,
  parseItem: (
    context: ApiContext,
    parser: ApiParser,
    item: unknown,
    index: number,
  ) => void,
): void {
  if (!isArray(node)) {
    throw new ApiError(name + " must be an array", {
      location: currentLocation(context),
    });
  }
  for (let index = 0; index < node.length; index += 1) {
    const item = node[index];
    if (item === undefined) {
      continue;
    }
    nestFrame(context, (frame: Frame): void => {
      frame.nodeKey = index;
      frame.node = item;
      parseItem(context, parser, item, index);
    });
  }
}

/** @internal */
function parseObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
  name: string,
  parseProperty: (
    context: ApiContext,
    parser: ApiParser,
    value: unknown,
    key: string,
  ) => void,
): void {
  if (!isObject(node)) {
    throw new ApiError(name + " must be an object", {
      location: currentLocation(context),
    });
  }
  for (const [key, value] of Object.entries(node)) {
    if (value === undefined) {
      continue;
    }
    nestFrame(context, (frame: Frame): void => {
      frame.nodeKey = key;
      frame.node = value;
      parseProperty(context, parser, value, key);
    });
  }
}

/** @internal */
export type ApiParser = typeof apiParser;

/** @internal */
export const apiParser = {
  parseOpenApiObject,
  parseInfoObject,
  parseContactObject,
  parseLicenseObject,
  parseServerObject,
  parseServerVariableObject,
  parseComponentsObject,
  parsePathsObject,
  parsePathItemObject,
  parseOperationObject,
  parseExternalDocsObject,
  parseParameterReference,
  parseParameterObject,
  parseRequestBodyReference,
  parseRequestBodyObject,
  parseMediaTypeObject,
  parseEncodingObject,
  parseResponsesObject,
  parseResponseReference,
  parseResponseObject,
  parseCallbackReference,
  parseCallbackObject,
  parseExampleReference,
  parseExampleObject,
  parseLinkReference,
  parseLinkObject,
  parseHeaderReference,
  parseHeaderObject,
  parseTagObject,
  parseReferenceObject,
  parseSchemaObject,
  parseSecuritySchemeObject,
  parseOAuthFlowsObject,
  parseOAuthFlowObject,
  parseSecurityRequirementObject,

  parseExtension,
  parseBoolean,
  parseString,
  parseArray,
  parseObject,
} as const;
