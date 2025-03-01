import type { ApiContext } from "../context.ts";
import type { ComponentsObject } from "./components.ts";
import type { MediaTypeObject } from "./media-type.ts";
import type { HeaderObject } from "./header.ts";
import type { LinkObject } from "./link.ts";
import type { ReferenceObject } from "./reference.ts";
import type { ApiParser } from "./parser.ts";

/**
 * A container for the expected responses of an operation. The container maps
 * a HTTP response code to the expected response.
 *
 * @see [OpenAPI Specification §4.8.16](https://spec.openapis.org/oas/v3.1.1.html#responses-object)
 */
export interface ResponsesObject {
  /**
   * The documentation of responses other than the ones declared for specific
   * HTTP response codes. Use this field to cover undeclared responses.
   */
  readonly default?: ResponseObject | ReferenceObject;

  /**
   * Any [HTTP status code](
   * https://spec.openapis.org/oas/v3.1.1.html#http-status-codes) can be
   * used as the property name, but only one property per code, to describe
   * the expected response for that HTTP status code. To define a range of
   * response codes, this field _MAY_ contain the uppercase wildcard
   * character `X`. For example, `2XX` represents all response codes between
   * `200` and `299`. Only the following range definitions are allowed:
   * `1XX`, `2XX`, `3XX`, `4XX`, and `5XX`. If a response is defined using
   * an explicit code, the explicit code definition takes precedence over
   * the range definition for that code.
   */
  readonly [code: string]: ResponseObject | ReferenceObject;
}

/** @internal */
export function parseResponsesObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Responses Object",
    parseResponsesField,
  );
}

/** @internal */
function parseResponsesField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  if (key.startsWith("x-")) {
    parser.parseExtension(context, "Responses Object", key, value);
  }
  parser.parseResponseReference(context, parser, value);
}

/**
 * Describes a single response from an API operation, including design-time,
 * static `links` to operations based on the response.
 *
 * @see [OpenAPI Specification §4.8.17](https://spec.openapis.org/oas/v3.1.1.html#response-object)
 */
export interface ResponseObject {
  /**
   * A description of the response. [CommonMark](https://spec.commonmark.org/)
   * syntax _MAY_ be used for rich text representation.
   */
  readonly description?: string;

  /**
   * Maps a header name to its definition. [RFC7230](
   * https://httpwg.org/specs/rfc7230.html) [Section 3.2](
   * https://datatracker.ietf.org/doc/html/rfc7230#section-3.2)
   * states header names are case insensitive. If a response header
   * is defined with the name `"Content-Type"`, it _SHALL_ be ignored.
   */
  readonly headers?: { readonly [key: string]: HeaderObject | ReferenceObject };

  /**
   * A map containing descriptions of potential response payloads.
   * The key is a media type or media type range, see [RFC7231](
   * https://httpwg.org/specs/rfc7231.html) [Appendix D](
   * https://datatracker.ietf.org/doc/html/rfc7231#appendix-D),
   * and the value describes it. For responses that match multiple keys,
   * only the most specific key is applicable. e.g. `"text/plain"`
   * overrides `"text/*"`.
   */
  readonly content?: { readonly [mediaType: string]: MediaTypeObject };

  /**
   * A map of operations links that can be followed from the response.
   * The key of the map is a short name for the link, following the naming
   * constraints of the names for {@link ComponentsObject Component Objects}.
   */
  readonly links?: { readonly [key: string]: LinkObject | ReferenceObject };
}

/** @internal */
export function parseResponseReference(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseReferenceObject(context, parser, node, parseResponseObject);
}

/** @internal */
export function parseResponseObject(
  context: ApiContext,
  parser: ApiParser,
  node: unknown,
): void {
  parser.parseObject(
    context,
    parser,
    node,
    "Response Object",
    parseResponseField,
  );
}

/** @internal */
function parseResponseField(
  context: ApiContext,
  parser: ApiParser,
  value: unknown,
  key: string,
): void {
  switch (key) {
    case "description":
      parser.parseString(context, parser, value, key);
      break;
    case "headers":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseHeaderReference,
      );
      break;
    case "content":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseMediaTypeObject,
      );
      break;
    case "links":
      parser.parseObject(
        context,
        parser,
        value,
        key,
        parser.parseLinkReference,
      );
      break;
    default:
      parser.parseExtension(context, "Response Object", key, value);
  }
}
