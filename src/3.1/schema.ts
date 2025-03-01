import type { Frame } from "tool-json";
import { nestFrame } from "tool-json";
import type { SchemaOas31 } from "tool-schema";
import { parseSchemaResource } from "tool-schema";
import type { ApiContext } from "../context.ts";
import type { ApiParser } from "./parser.ts";

/**
 * The Schema Object allows the definition of input and output data types.
 * These types can be objects, but also primitives and arrays. This object is
 * a superset of the JSON Schema Specification Draft 2020-12. The empty schema
 * (which allows any instance to validate) MAY be represented by the boolean
 * value true and a schema which allows no instance to validate MAY be
 * represented by the boolean value false.
 *
 * For more information about the keywords, see JSON Schema Core and JSON
 * Schema Validation.
 *
 * Unless stated otherwise, the keyword definitions follow those of JSON Schema
 * and do not add any additional semantics; this includes keywords such as
 * $schema, $id, $ref, and $dynamicRef being URIs rather than URLs.
 * Where JSON Schema indicates that behavior is defined by the application
 * (e.g. for annotations), OAS also defers the definition of semantics to
 * the application consuming the OpenAPI document.
 *
 * @see [OpenAPI Specification §4.8.24](https://spec.openapis.org/oas/v3.1.1.html#schema-object)
 */
export type SchemaObject = SchemaOas31 | boolean;

/** @internal */
export function parseSchemaObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  // Isolate schema parsing in a nested stack frame.
  nestFrame(context, (frame: Frame): void => {
    frame.node = node;
    parseSchemaResource(context);
  });
}
