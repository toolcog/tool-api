import type { ApiContext } from "../context.ts";
import type { PathItemObject } from "./path.ts";
import type { ParameterObject } from "./parameter.ts";
import type { RequestBodyObject } from "./request-body.ts";
import type { ResponseObject } from "./response.ts";
import type { CallbackObject } from "./callback.ts";
import type { ExampleObject } from "./example.ts";
import type { LinkObject } from "./link.ts";
import type { HeaderObject } from "./header.ts";
import type { SchemaObject } from "./schema.ts";
import type { SecuritySchemeObject } from "./security-scheme.ts";
import type { ApiParser } from "./parser.ts";

/**
 * Holds a set of reusable objects for different aspects of the OAS.
 * All objects defined within the Components Object will have no effect
 * on the API unless they are explicitly referenced from outside the
 * Components Object.
 *
 * @see [OpenAPI Specification §4.8.7](https://spec.openapis.org/oas/v3.1.1.html#components-object)
 */
export interface ComponentsObject {
  /**
   * An object to hold reusable {@link SchemaObject Schema Objects}.
   */
  readonly schemas?: { readonly [key: string]: SchemaObject };

  /**
   * An object to hold reusable {@link ResponseObject Response Objects}.
   */
  readonly responses?: { readonly [key: string]: ResponseObject };

  /**
   * An object to hold reusable {@link ParameterObject Parameter Objects}.
   */
  readonly parameters?: { readonly [key: string]: ParameterObject };

  /**
   * An object to hold reusable {@link ExampleObject Example Objects}.
   */
  readonly examples?: { readonly [key: string]: ExampleObject };

  /**
   * An object to hold reusable {@link RequestBodyObject Request Body Objects}.
   */
  readonly requestBodies?: { readonly [key: string]: RequestBodyObject };

  /**
   * An object to hold reusable {@link HeaderObject Header Objects}.
   */
  readonly headers?: { readonly [key: string]: HeaderObject };

  /**
   * An object to hold reusable
   * {@link SecuritySchemeObject Security Scheme Objects}.
   */
  readonly securitySchemes?: { readonly [key: string]: SecuritySchemeObject };

  /**
   * An object to hold reusable {@link LinkObject Link Objects}.
   */
  readonly links?: { readonly [key: string]: LinkObject };

  /**
   * An object to hold reusable {@link CallbackObject Callback Objects}.
   */
  readonly callbacks?: { readonly [key: string]: CallbackObject };

  /**
   * An object to hold reusable {@link PathItemObject Path Item Objects}.
   */
  readonly pathItems?: { readonly [key: string]: PathItemObject };
}

/** @internal */
export function parseComponentsObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Components Object",
    parseComponentsField,
  );
}

/** @internal */
function parseComponentsField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "schemas":
      parser.parseObject(context, parser, value, key, parser.parseSchemaObject);
      break;
    case "responses":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseResponseObject,
      );
      break;
    case "parameters":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseParameterObject,
      );
      break;
    case "examples":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseExampleObject,
      );
      break;
    case "requestBodies":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseRequestBodyObject,
      );
      break;
    case "headers":
      parser.parseObject(context, parser, value, key, parser.parseHeaderObject);
      break;
    case "securitySchemes":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseSecuritySchemeObject,
      );
      break;
    case "links":
      parser.parseObject(context, parser, value, key, parser.parseLinkObject);
      break;
    case "callbacks":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseCallbackObject,
      );
      break;
    case "pathItems":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parsePathItemObject,
      );
      break;
    default:
      parser.parseExtension(context, "Components Object", key, value);
  }
}
