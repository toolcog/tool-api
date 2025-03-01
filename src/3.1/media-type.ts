import type { ApiContext } from "../context.ts";
import type { RequestBodyObject } from "./request-body.ts";
import type { EncodingObject } from "./encoding.ts";
import type { ExampleObject } from "./example.ts";
import type { ReferenceObject } from "./reference.ts";
import type { SchemaObject } from "./schema.ts";
import type { ApiParser } from "./parser.ts";

export type MediaTypesObject = {
  readonly [mediaType: string]: MediaTypeObject;
};

/**
 * Each Media Type Object provides schema and examples for the media type
 * identified by its key.
 *
 * @see [OpenAPI Specification §4.8.14](https://spec.openapis.org/oas/v3.1.1.html#media-type-object)
 */
export interface MediaTypeObject {
  /**
   * The schema defining the content of the request, response, parameter,
   * or header.
   */
  readonly schema?: SchemaObject;

  /**
   * Example of the media type.
   */
  readonly example?: unknown;

  /**
   * Examples of the media type.
   */
  readonly examples?: {
    readonly [name: string]: ExampleObject | ReferenceObject;
  };

  /**
   * A map between a property name and its encoding information. The key,
   * being the property name, _MUST_ exist in the schema as a property.
   * The `encoding` field _SHALL_ only apply to
   * {@link RequestBodyObject Request Body Objects}, and only when the
   * media type is `multipart` or `application/x-www-form-urlencoded`.
   * If no Encoding Object is provided for a property, the behavior is
   * determined by the default values documented for the Encoding Object.
   */
  readonly encoding?: { readonly [mediaType: string]: EncodingObject };
}

/** @internal */
export function parseMediaTypeObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Media Type Object",
    parseMediaTypeField,
  );
}

/** @internal */
function parseMediaTypeField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "schema":
      parser.parseSchemaObject(context, parser, value);
      break;
    case "example":
      break;
    case "examples":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseExampleReference,
      );
      break;
    case "encoding":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseEncodingObject,
      );
      break;
    default:
      parser.parseExtension(context, "Media Type Object", key, value);
  }
}
