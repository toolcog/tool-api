import type { Frame } from "tool-json";
import {
  initContext,
  nestFrame,
  getResource,
  getReference,
  traverseReference,
  resolveReferences,
} from "tool-json";
import { initSchemaContext, dialects } from "tool-schema";
import type { ApiContext, ApiContextOptions } from "./context.ts";
import { initApiContext } from "./context.ts";
import * as OpenApi31 from "./3.1/mod.ts";
import type { ApiResource } from "./resource.ts";
import { parseApiResource } from "./resource.ts";

/**
 * Options for parsing an OpenAPI document.
 *
 * @category API
 */
export interface ApiOptions extends ApiContextOptions {
  /**
   * The base URI of the OpenAPI document.
   */
  readonly baseUri?: string | undefined;
}

/**
 * A handle to a resolved OpenAPI document.
 *
 * @category API
 */
export class Api {
  /**
   * The raw document node.
   */
  readonly node: OpenApi31.OpenApiObject;

  /**
   * The context in which the document was parsed.
   */
  readonly #context: ApiContext;

  /** @internal */
  constructor(node: OpenApi31.OpenApiObject, context: ApiContext) {
    this.node = node;
    this.#context = context;
  }

  /**
   * The context in which the document was parsed.
   */
  get context(): ApiContext {
    return this.#context;
  }

  /**
   * The JSON resource associated with the document node.
   */
  get resource(): ApiResource | undefined {
    return getResource(this.context, this.node) as ApiResource | undefined;
  }

  get openapi(): string | undefined {
    return this.node.openapi;
  }

  get info(): OpenApi31.InfoObject | undefined {
    return this.node.info;
  }

  get jsonSchemaDialect(): string | undefined {
    return this.node.jsonSchemaDialect;
  }

  get servers(): readonly OpenApi31.ServerObject[] | undefined {
    return this.node.servers;
  }

  get paths(): ApiPaths {
    return new ApiPaths(this.node.paths, this);
  }

  get webhooks():
    | { readonly [key: string]: OpenApi31.PathItemObject }
    | undefined {
    return this.node.webhooks;
  }

  get components(): OpenApi31.ComponentsObject | undefined {
    return this.node.components;
  }

  get security(): readonly OpenApi31.SecurityRequirementObject[] | undefined {
    return this.node.security;
  }

  get tags(): readonly OpenApi31.TagObject[] | undefined {
    return this.node.tags;
  }

  get externalDocs(): OpenApi31.ExternalDocsObject | undefined {
    return this.node.externalDocs;
  }

  /**
   * Returns an iterator over all operations in this API.
   */
  *operations(): IterableIterator<ApiOperation> {
    for (const pathItem of this.paths) {
      for (const operation of pathItem.operations()) {
        yield operation;
      }
    }
  }

  /**
   * Returns the raw document node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * Parses and resolves an OpenAPI document.
 *
 * @category API
 */
export async function parseApi(
  node: unknown,
  options?: ApiOptions,
): Promise<Api> {
  const context = initApiContext(
    initSchemaContext(initContext({}, options), options),
  );

  // Configure JSON Schema dialects.
  if (context.dialects === undefined) {
    // Support all standard dialects.
    context.dialects = dialects;
  }

  // Configure the OpenAPI parser.
  if (context.apiParser === undefined) {
    context.apiParser = OpenApi31.apiParser;
  }

  // Isolate parsing in a nested stack frame.
  await nestFrame(context, async (frame: Frame): Promise<void> => {
    frame.node = node;
    // Parse the OpenAPI object.
    const resource = parseApiResource(context);
    // Resolve all references registered during parsing.
    await resolveReferences(context, resource);
  });

  return new Api(node as OpenApi31.OpenApiObject, context);
}

/**
 * A handle to a resolved paths object.
 *
 * @category API
 */
export class ApiPaths implements Iterable<ApiPathItem> {
  /**
   * The raw paths node.
   */
  readonly node: OpenApi31.PathsObject | undefined;

  /**
   * The API to which these paths belong.
   */
  readonly #api: Api;

  /** @internal */
  constructor(node: OpenApi31.PathsObject | undefined, api: Api) {
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which these paths belong.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * Returns the path item for the given template key.
   */
  get(template: string): ApiPathItem | undefined {
    const pathItem = this.node?.[template];
    if (pathItem === undefined || template.startsWith("x-")) {
      return undefined;
    }
    return new ApiPathItem(template, pathItem, this.api);
  }

  /**
   * Returns an iterator over the path items.
   */
  *[Symbol.iterator](): IterableIterator<ApiPathItem> {
    if (this.node === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(this.node)) {
      if (key.startsWith("x-")) {
        continue;
      }
      yield new ApiPathItem(key, value, this.api);
    }
  }

  /**
   * Returns the raw paths node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved path item object.
 *
 * @category API
 */
export class ApiPathItem {
  /**
   * The path template of the path item.
   */
  readonly key: string;

  /**
   * The raw path item node.
   */
  readonly node: OpenApi31.PathItemObject;

  /**
   * The API in which this path item belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(key: string, node: OpenApi31.PathItemObject, api: Api) {
    this.key = key;
    this.node = node;
    this.#api = api;
  }

  /**
   * The API in which this path item belongs.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * The resolved path item reference.
   */
  get resolved(): ApiPathItem | undefined {
    const reference = getReference(this.api.context, this.node);
    if (reference?.target === undefined) {
      return undefined;
    }
    return new ApiPathItem(
      this.key,
      reference.target as OpenApi31.PathItemObject,
      this.api,
    );
  }

  get $ref(): string | undefined {
    return this.node.$ref;
  }

  get summary(): string | undefined {
    return this.node.summary ?? this.resolved?.summary;
  }

  get description(): string | undefined {
    return this.node.description ?? this.resolved?.description;
  }

  get get(): ApiOperation | undefined {
    if (this.node.get === undefined) {
      return this.resolved?.get;
    }
    return new ApiOperation("get", this.node.get, this);
  }

  get put(): ApiOperation | undefined {
    if (this.node.put === undefined) {
      return this.resolved?.put;
    }
    return new ApiOperation("put", this.node.put, this);
  }

  get post(): ApiOperation | undefined {
    if (this.node.post === undefined) {
      return this.resolved?.post;
    }
    return new ApiOperation("post", this.node.post, this);
  }

  get delete(): ApiOperation | undefined {
    if (this.node.delete === undefined) {
      return this.resolved?.delete;
    }
    return new ApiOperation("delete", this.node.delete, this);
  }

  get options(): ApiOperation | undefined {
    if (this.node.options === undefined) {
      return this.resolved?.options;
    }
    return new ApiOperation("options", this.node.options, this);
  }

  get head(): ApiOperation | undefined {
    if (this.node.head === undefined) {
      return this.resolved?.head;
    }
    return new ApiOperation("head", this.node.head, this);
  }

  get patch(): ApiOperation | undefined {
    if (this.node.patch === undefined) {
      return this.resolved?.patch;
    }
    return new ApiOperation("patch", this.node.patch, this);
  }

  get trace(): ApiOperation | undefined {
    if (this.node.trace === undefined) {
      return this.resolved?.trace;
    }
    return new ApiOperation("trace", this.node.trace, this);
  }

  get servers(): readonly OpenApi31.ServerObject[] | undefined {
    return this.node.servers ?? this.resolved?.servers;
  }

  get parameters(): readonly ApiParameter[] | undefined {
    if (this.node.parameters === undefined) {
      return this.resolved?.parameters;
    }
    return this.node.parameters.map((parameter) => {
      return new ApiParameter(parameter, this.api);
    });
  }

  /**
   * Returns an iterator over all operations on this path item.
   */
  *operations(): IterableIterator<ApiOperation> {
    const seen = new Set<string>();
    let pathItem: ApiPathItem | undefined = this;
    do {
      for (const [key, value] of Object.entries(pathItem.node)) {
        if (!(key in OPERATIONS) || seen.has(key)) {
          continue;
        }
        seen.add(key);
        yield new ApiOperation(key, value as OpenApi31.OperationObject, this);
      }
      pathItem = pathItem.resolved;
    } while (pathItem !== undefined);
  }

  /**
   * Returns the raw path item node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/** @internal */
const OPERATIONS = {
  get: true,
  put: true,
  post: true,
  delete: true,
  options: true,
  head: true,
  patch: true,
  trace: true,
} as const;

/**
 * A handle to a resolved operation object.
 *
 * @category API
 */
export class ApiOperation {
  /**
   * The HTTP method performed by this operation.
   */
  readonly key: string;

  /**
   * The raw operation node.
   */
  readonly node: OpenApi31.OperationObject;

  /**
   * The path item to which this operation belongs.
   */
  readonly #pathItem: ApiPathItem;

  /** @internal */
  constructor(
    key: string,
    node: OpenApi31.OperationObject,
    pathItem: ApiPathItem,
  ) {
    this.key = key;
    this.node = node;
    this.#pathItem = pathItem;
  }

  /**
   * The API to which this operation belongs.
   */
  get api(): Api {
    return this.pathItem.api;
  }

  /**
   * The path item to which this operation belongs.
   */
  get pathItem(): ApiPathItem {
    return this.#pathItem;
  }

  get method(): string {
    return this.key.toUpperCase();
  }

  get path(): string {
    return this.pathItem.key;
  }

  get tags(): readonly string[] | undefined {
    return this.node.tags;
  }

  get summary(): string | undefined {
    return this.node.summary;
  }

  get description(): string | undefined {
    return this.node.description;
  }

  get externalDocs(): OpenApi31.ExternalDocsObject | undefined {
    return this.node.externalDocs;
  }

  get operationId(): string | undefined {
    return this.node.operationId;
  }

  get parameters(): readonly ApiParameter[] | undefined {
    if (this.node.parameters === undefined) {
      return undefined;
    }
    return this.node.parameters.map((parameter) => {
      return new ApiParameter(parameter, this.api);
    });
  }

  get allParameters(): readonly ApiParameter[] {
    const parameters: ApiParameter[] = [];

    // Include direct parameters.
    if (this.parameters !== undefined) {
      parameters.push(...this.parameters);
    }

    // Include path item parameters.
    if (this.pathItem.parameters !== undefined) {
      for (const parameter of this.pathItem.parameters) {
        if (hasParameter(parameters, parameter.name, parameter.in)) {
          continue;
        }
        parameters.push(parameter);
      }
    }

    return parameters;
  }

  get requestBody(): ApiRequestBody | undefined {
    if (this.node.requestBody === undefined) {
      return undefined;
    }
    return new ApiRequestBody(this.node.requestBody, this.api);
  }

  get responses(): ApiResponses {
    return new ApiResponses(this.node.responses, this.api);
  }

  get callbacks(): ApiCallbacks {
    return new ApiCallbacks(this.node.callbacks, this.api);
  }

  get deprecated(): boolean | undefined {
    return this.node.deprecated;
  }

  get security(): readonly OpenApi31.SecurityRequirementObject[] | undefined {
    return this.node.security;
  }

  get servers(): readonly OpenApi31.ServerObject[] | undefined {
    return this.node.servers;
  }

  /**
   * Returns the raw operation node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

export class ApiParameter {
  readonly node: OpenApi31.ParameterObject;

  /**
   * The API to which this parameter belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(
    node: OpenApi31.ParameterObject | OpenApi31.ReferenceObject,
    api: Api,
  ) {
    this.node = traverseReference(
      api.context,
      node,
    ) as OpenApi31.ParameterObject;
    this.#api = api;
  }

  /**
   * The API to which this parameter belongs.
   */
  get api(): Api {
    return this.#api;
  }

  get name(): string | undefined {
    return this.node.name;
  }

  get in(): "query" | "header" | "path" | "cookie" | undefined {
    return this.node.in;
  }

  get description(): string | undefined {
    return this.node.description;
  }

  get required(): boolean | undefined {
    return this.node.required;
  }

  get deprecated(): boolean | undefined {
    return this.node.deprecated;
  }

  get allowEmptyValue(): boolean | undefined {
    return this.node.allowEmptyValue;
  }

  get style(): string | undefined {
    return this.node.style;
  }

  get explode(): boolean | undefined {
    return this.node.explode;
  }

  get allowReserved(): boolean | undefined {
    return this.node.allowReserved;
  }

  get schema(): OpenApi31.SchemaObject | undefined {
    return this.node.schema;
  }

  get example(): unknown | undefined {
    return this.node.example;
  }

  get examples(): ApiExamples {
    return new ApiExamples(this.node.examples, this.api);
  }

  get content(): ApiContentTypes {
    return new ApiContentTypes(this.node.content, this.api);
  }

  /**
   * Returns the raw parameter node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * Returns `true` if the given `parameters` array contains a parameter
 * with the specified `name` and `location`.
 *
 * @internal
 */
function hasParameter(
  parameters: readonly {
    readonly name: string | undefined;
    readonly in: string | undefined;
  }[],
  name: string | undefined,
  location: string | undefined,
): boolean {
  for (const parameter of parameters) {
    if (parameter.name === name && parameter.in === location) {
      return true;
    }
  }
  return false;
}

/**
 * A handle to a resolved request body object.
 *
 * @category API
 */
export class ApiRequestBody {
  /**
   * The raw request body node.
   */
  readonly node: OpenApi31.RequestBodyObject;

  /**
   * The API to which this request body belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(
    node: OpenApi31.RequestBodyObject | OpenApi31.ReferenceObject,
    api: Api,
  ) {
    this.node = traverseReference(
      api.context,
      node,
    ) as OpenApi31.RequestBodyObject;
    this.#api = api;
  }

  /**
   * The API to which this request body belongs.
   */
  get api(): Api {
    return this.#api;
  }

  get description(): string | undefined {
    return this.node.description;
  }

  get content(): ApiContentTypes {
    return new ApiContentTypes(this.node.content, this.api);
  }

  get required(): boolean | undefined {
    return this.node.required;
  }

  /**
   * Returns the raw request body node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved content types object.
 *
 * @category API
 */
export class ApiContentTypes implements Iterable<ApiContentType> {
  /**
   * The raw content types node.
   */
  readonly node: OpenApi31.MediaTypesObject | undefined;

  /**
   * The API to which these content types belong.
   */
  readonly #api: Api;

  /** @internal */
  constructor(node: OpenApi31.MediaTypesObject | undefined, api: Api) {
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which these content types belong.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * Returns the content type object for the given media type.
   */
  get(mediaType: string): ApiContentType | undefined {
    const contentType = this.node?.[mediaType];
    if (contentType === undefined) {
      return undefined;
    }
    return new ApiContentType(mediaType, contentType, this.api);
  }

  /**
   * Returns an iterator over the content types.
   */
  *[Symbol.iterator](): IterableIterator<ApiContentType> {
    if (this.node === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(this.node)) {
      yield new ApiContentType(key, value, this.api);
    }
  }

  /**
   * Returns the raw content types node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved content type object.
 *
 * @category API
 */
export class ApiContentType {
  /**
   * The media type or media type range of the content type.
   */
  readonly key: string;

  /**
   * The raw content type node.
   */
  readonly node: OpenApi31.MediaTypeObject;

  /**
   * The API to which this content type belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(key: string, node: OpenApi31.MediaTypeObject, api: Api) {
    this.key = key;
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which this content type belongs.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * The media type or media type range of the content type.
   */
  get mediaType(): string {
    return this.key;
  }

  get schema(): OpenApi31.SchemaObject | undefined {
    return this.node.schema;
  }

  get example(): unknown | undefined {
    return this.node.example;
  }

  get examples(): ApiExamples {
    return new ApiExamples(this.node.examples, this.api);
  }

  get encoding(): OpenApi31.EncodingsObject | undefined {
    return this.node.encoding;
  }

  /**
   * Returns the raw content type node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved responses object.
 *
 * @category API
 */
export class ApiResponses implements Iterable<ApiResponse> {
  /**
   * The raw responses node.
   */
  readonly node: OpenApi31.ResponsesObject | undefined;

  /**
   * The API to which these responses belong.
   */
  readonly #api: Api;

  /** @internal */
  constructor(node: OpenApi31.ResponsesObject | undefined, api: Api) {
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which these responses belong.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * The default response.
   */
  get default(): ApiResponse | undefined {
    if (this.node?.default === undefined) {
      return undefined;
    }
    return new ApiResponse("default", this.node.default, this.api);
  }

  /**
   * Returns the response for the given status code.
   */
  get(code: string): ApiResponse | undefined {
    const response = this.node?.[code];
    if (response === undefined || code.startsWith("x-")) {
      return undefined;
    }
    return new ApiResponse(code, response, this.api);
  }

  /**
   * Returns an iterator over the responses.
   */
  *[Symbol.iterator](): IterableIterator<ApiResponse> {
    if (this.node === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(this.node)) {
      if (key.startsWith("x-")) {
        continue;
      }
      yield new ApiResponse(key, value, this.api);
    }
  }

  /**
   * Returns the raw responses node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved response object.
 *
 * @category API
 */
export class ApiResponse {
  /**
   * The status code of the response.
   */
  readonly key: string;

  /**
   * The raw response node.
   */
  readonly node: OpenApi31.ResponseObject;

  /**
   * The API to which this response belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(
    key: string,
    node: OpenApi31.ResponseObject | OpenApi31.ReferenceObject,
    api: Api,
  ) {
    this.key = key;
    this.node = traverseReference(
      api.context,
      node,
    ) as OpenApi31.ResponseObject;
    this.#api = api;
  }

  /**
   * The API to which this response belongs.
   */
  get api(): Api {
    return this.#api;
  }

  get description(): string | undefined {
    return this.node.description;
  }

  get headers(): ApiHeaders | undefined {
    if (this.node.headers === undefined) {
      return undefined;
    }
    return new ApiHeaders(this.node.headers, this.api);
  }

  get content(): ApiContentTypes {
    return new ApiContentTypes(this.node.content, this.api);
  }

  get links(): OpenApi31.LinksObject | undefined {
    return this.node.links;
  }

  /**
   * Returns the raw response node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved callbacks object.
 *
 * @category API
 */
export class ApiCallbacks implements Iterable<ApiCallback> {
  /**
   * The raw callbacks node.
   */
  readonly node: OpenApi31.CallbacksObject | undefined;

  /**
   * The API to which these callbacks belong.
   */
  readonly #api: Api;

  /** @internal */
  constructor(node: OpenApi31.CallbacksObject | undefined, api: Api) {
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which these callbacks belong.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * Returns the callback for the given key.
   */
  get(key: string): ApiCallback | undefined {
    const callback = this.node?.[key];
    if (callback === undefined) {
      return undefined;
    }
    return new ApiCallback(key, callback, this.api);
  }

  /**
   * Returns an iterator over the callbacks.
   */
  *[Symbol.iterator](): IterableIterator<ApiCallback> {
    if (this.node === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(this.node)) {
      yield new ApiCallback(key, value, this.api);
    }
  }

  /**
   * Returns the raw callbacks node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved callback object.
 *
 * @category API
 */
export class ApiCallback implements Iterable<ApiPathItem> {
  /**
   * The unique identifier for the callback.
   */
  readonly key: string;

  /**
   * The raw callback node.
   */
  readonly node: OpenApi31.CallbackObject;

  /**
   * The API to which this callback belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(
    key: string,
    node: OpenApi31.CallbackObject | OpenApi31.ReferenceObject,
    api: Api,
  ) {
    this.key = key;
    this.node = traverseReference(
      api.context,
      node,
    ) as OpenApi31.CallbackObject;
    this.#api = api;
  }

  /**
   * The API to which this callback belongs.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * Returns the path item for the given expression.
   */
  get(expression: string): ApiPathItem | undefined {
    const pathItem = this.node[expression];
    if (pathItem === undefined) {
      return undefined;
    }
    return new ApiPathItem(expression, pathItem, this.api);
  }

  /**
   * Returns an iterator over the path items.
   */
  *[Symbol.iterator](): IterableIterator<ApiPathItem> {
    for (const [key, value] of Object.entries(this.node)) {
      yield new ApiPathItem(key, value, this.api);
    }
  }

  /**
   * Returns the raw callback node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved examples object.
 *
 * @category API
 */
export class ApiExamples implements Iterable<ApiExample> {
  /**
   * The raw examples node.
   */
  readonly node: OpenApi31.ExamplesObject | undefined;

  /**
   * The API to which these examples belong.
   */
  readonly #api: Api;

  /** @internal */
  constructor(node: OpenApi31.ExamplesObject | undefined, api: Api) {
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which these examples belong.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * Returns the example for the given key.
   */
  get(key: string): ApiExample | undefined {
    const example = this.node?.[key];
    if (example === undefined) {
      return undefined;
    }
    return new ApiExample(key, example, this.api);
  }

  /**
   * Returns an iterator over the examples.
   */
  *[Symbol.iterator](): IterableIterator<ApiExample> {
    if (this.node === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(this.node)) {
      yield new ApiExample(key, value, this.api);
    }
  }

  /**
   * Returns the raw examples node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved example object.
 *
 * @category API
 */
export class ApiExample {
  /**
   * The name of the example.
   */
  readonly key: string;

  /**
   * The raw example node.
   */
  readonly node: OpenApi31.ExampleObject;

  /**
   * The API to which this example belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(
    key: string,
    node: OpenApi31.ExampleObject | OpenApi31.ReferenceObject,
    api: Api,
  ) {
    this.key = key;
    this.node = traverseReference(api.context, node) as OpenApi31.ExampleObject;
    this.#api = api;
  }

  /**
   * The API to which this example belongs.
   */
  get api(): Api {
    return this.#api;
  }

  get summary(): string | undefined {
    return this.node.summary;
  }

  get description(): string | undefined {
    return this.node.description;
  }

  get value(): unknown | undefined {
    return this.node.value;
  }

  get externalValue(): string | undefined {
    return this.node.externalValue;
  }

  /**
   * Returns the raw example node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved headers object.
 *
 * @category API
 */
export class ApiHeaders implements Iterable<ApiHeader> {
  /**
   * The raw headers node.
   */
  readonly node: OpenApi31.HeadersObject | undefined;

  /**
   * The API to which these headers belong.
   */
  readonly #api: Api;

  /** @internal */
  constructor(node: OpenApi31.HeadersObject | undefined, api: Api) {
    this.node = node;
    this.#api = api;
  }

  /**
   * The API to which these headers belong.
   */
  get api(): Api {
    return this.#api;
  }

  /**
   * Returns the header for the given key.
   */
  get(key: string): ApiHeader | undefined {
    const header = this.node?.[key];
    if (header === undefined) {
      return undefined;
    }
    return new ApiHeader(key, header, this.api);
  }

  /**
   * Returns an iterator over the headers.
   */
  *[Symbol.iterator](): IterableIterator<ApiHeader> {
    if (this.node === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(this.node)) {
      yield new ApiHeader(key, value, this.api);
    }
  }

  /**
   * Returns the raw headers node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * A handle to a resolved header object.
 *
 * @category API
 */
export class ApiHeader {
  /**
   * The name of the header.
   */
  readonly key: string;

  /**
   * The raw header node.
   */
  readonly node: OpenApi31.HeaderObject;

  /**
   * The API to which this header belongs.
   */
  readonly #api: Api;

  /** @internal */
  constructor(
    key: string,
    node: OpenApi31.HeaderObject | OpenApi31.ReferenceObject,
    api: Api,
  ) {
    this.key = key;
    this.node = traverseReference(api.context, node) as OpenApi31.HeaderObject;
    this.#api = api;
  }

  /**
   * The API to which this header belongs.
   */
  get api(): Api {
    return this.#api;
  }

  get description(): string | undefined {
    return this.node.description;
  }

  get required(): boolean | undefined {
    return this.node.required;
  }

  get deprecated(): boolean | undefined {
    return this.node.deprecated;
  }

  get style(): string | undefined {
    return this.node.style;
  }

  get explode(): boolean | undefined {
    return this.node.explode;
  }

  get schema(): OpenApi31.SchemaObject | undefined {
    return this.node.schema;
  }

  get example(): unknown | undefined {
    return this.node.example;
  }

  get examples(): ApiExamples {
    return new ApiExamples(this.node.examples, this.api);
  }

  get content(): ApiContentTypes {
    return new ApiContentTypes(this.node.content, this.api);
  }

  /**
   * Returns the raw header node.
   */
  toJSON(): unknown {
    return this.node;
  }
}
