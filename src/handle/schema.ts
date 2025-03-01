import { isArray, isObject, getReference } from "tool-json";
import {
  createQuery,
  createChildSegment,
  createNameSelector,
  createWildcardSelector,
  formatQuery,
} from "tool-query";
import type { ApiContext } from "../context.ts";
import type { ApiOperation, ApiResponse } from "../api.ts";

/** @internal */
export interface ApiSchemaState {
  /**
   * The name of the current iteration variable.
   */
  varname: string;

  /**
   * The depth of the current node in the response.
   */
  depth: number;

  /**
   * The OpenAPI response being transformed.
   */
  response: ApiResponse | undefined;

  /**
   * The OpenAPI operation being transformed.
   */
  operation: ApiOperation | undefined;
}

interface BaseSchema {
  readonly type?: readonly string[] | string | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly default?: unknown | undefined;
}

interface StringSchema extends BaseSchema {
  readonly type?: "string";
}

function isStringSchema(schema: unknown): schema is StringSchema {
  return (
    isObject(schema) &&
    (schema.type === "string" ||
      (isArray(schema.type) && schema.type.includes("string")))
  );
}

interface ArraySchema extends BaseSchema {
  readonly type?: "array";
  readonly items?: unknown;
}

function isArraySchema(
  context: ApiContext,
  schema: unknown,
): schema is ArraySchema {
  return (
    isObject(schema) && (schema.type === "array" || schema.items !== undefined)
  );
}

interface ObjectSchema extends BaseSchema {
  readonly type?: "object";
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly properties?: { readonly [key: string]: unknown };
  readonly required?: readonly string[] | undefined;
}

function isObjectSchema(
  context: ApiContext,
  schema: unknown,
): schema is ObjectSchema {
  return (
    isObject(schema) &&
    (schema.type === "object" || isObject(schema.properties))
  );
}

/**
 * Generates a Tool Form template for JSON Schema.
 *
 * @category Handle
 */
export function generateSchemaTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: unknown,
): unknown {
  let content = generateMasterTemplate(context, state, schema);
  if (isArray(content) || !isObject(content)) {
    content = { $block: content };
  }

  return {
    $encode: "markdown",
    ...(content as object),
  };
}

function generateMasterTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: unknown,
): unknown {
  schema = resolveSchema(context, schema);

  if (isArraySchema(context, schema)) {
    return generateArrayMasterTemplate(context, state, schema);
  }

  if (isObjectSchema(context, schema)) {
    return generateObjectMasterTemplate(context, state, schema);
  }

  return generateFallbackTemplate(context, state, schema);
}

function generateElementTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: unknown,
): unknown {
  schema = resolveSchema(context, schema);

  if (state.depth > 6) {
    return generateFallbackTemplate(context, state, schema);
  }

  if (isObjectSchema(context, schema)) {
    return generateObjectElementTemplate(context, state, schema);
  }

  return generateFallbackTemplate(context, state, schema);
}

function generateObjectMasterTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: ObjectSchema,
): unknown {
  const title = schema.title ?? "Object";

  const description = schema.description;

  const keyPropertyItems = generateKeyPropertyItems(context, schema);
  const keyProperties =
    keyPropertyItems.length !== 0 ?
      ["**Key properties:**", { $ul: keyPropertyItems }]
    : [];

  return {
    $block: [
      { ["$h" + state.depth]: firstLine(title) },
      ...(description === undefined ? [] : [description]),
      ...keyProperties,
      {
        $lang: "json",
        $code: {
          $encode: "json",
          $indent: true,
          $content: { $: currentQuery(state) },
        },
      },
    ],
  };
}

function generateObjectElementTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: ObjectSchema,
): unknown {
  const [titleProperty] = pickTitleProperty(schema);

  const title =
    titleProperty !== undefined ?
      { $: childQuery(state, titleProperty) }
    : "Item";

  return {
    $block: [
      { ["$h" + state.depth]: title },
      {
        $lang: "json",
        $code: {
          $encode: "json",
          $indent: true,
          $content: { $: currentQuery(state) },
        },
      },
    ],
  };
}

function generateArrayMasterTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: ArraySchema,
): unknown {
  const itemSchema = resolveSchema(context, schema.items) as ObjectSchema;

  const title =
    schema.title ??
    (itemSchema.title !== undefined ? itemSchema.title + " list" : "List");

  const description = schema.description ?? itemSchema.description;

  const keyPropertyItems = generateKeyPropertyItems(context, itemSchema);
  const keyProperties =
    keyPropertyItems.length !== 0 ?
      ["**Key properties:**", { $ul: keyPropertyItems }]
    : [];

  let itemTemplate = generateElementTemplate(
    context,
    { ...state, varname: "item", depth: state.depth + 1 },
    itemSchema,
  );
  if (isArray(itemTemplate) || !isObject(itemTemplate)) {
    itemTemplate = { $value: itemTemplate };
  }

  return {
    $block: [
      { ["$h" + state.depth]: firstLine(title) },
      ...(description === undefined ? [] : [description]),
      ...keyProperties,
      {
        $each: childrenQuery(state),
        $as: "item",
        ...(itemTemplate as object),
      },
    ],
  };
}

function generateKeyPropertyItems(
  context: ApiContext,
  schema: ObjectSchema,
): readonly unknown[] {
  if (schema.properties === undefined) {
    return [];
  }

  const propertyItems: unknown[] = [];
  for (let [propName, propSchema] of Object.entries(schema.properties)) {
    propSchema = resolveSchema(context, propSchema);
    if (!isObject(propSchema)) {
      continue;
    }

    let summary = "";
    summary += "**" + propName + "**";
    if (typeof propSchema.description === "string") {
      summary += ": " + firstLine(propSchema.description);
    }
    if (propSchema.default !== undefined) {
      summary += " (default: " + propSchema.default + ")";
    }
    if (summary.length === 0) {
      summary = "\n";
    }

    const subPropertyItems =
      isObjectSchema(context, propSchema) ?
        generateKeyPropertyItems(context, propSchema)
      : [];

    const propertyItem =
      subPropertyItems.length !== 0 ?
        [summary, { $ul: subPropertyItems }]
      : summary;

    propertyItems.push(propertyItem);
  }

  return propertyItems;
}

function pickTitleProperty(
  schema: ObjectSchema,
): [string | undefined, unknown] {
  if (isStringSchema(schema.properties?.title)) {
    return ["title", schema.properties.title];
  }

  if (isStringSchema(schema.properties?.name)) {
    return ["name", schema.properties.name];
  }

  if (isStringSchema(schema.properties?.id)) {
    return ["id", schema.properties.id];
  }

  return [undefined, undefined];
}

function generateFallbackTemplate(
  context: ApiContext,
  state: ApiSchemaState,
  schema: unknown,
): unknown {
  return {
    $lang: "json",
    $code: {
      $encode: "json",
      $indent: true,
      $content: { $: currentQuery(state) },
    },
  };
}

function firstLine(text: string | undefined): string | undefined {
  if (text === undefined) {
    return undefined;
  }
  const index = text.indexOf("\n");
  return index === -1 ? text : text.slice(0, index);
}

function currentQuery(state: ApiSchemaState): string {
  return formatQuery(
    createQuery([createChildSegment([createNameSelector(state.varname)])]),
  );
}

function childrenQuery(state: ApiSchemaState): string {
  return formatQuery(
    createQuery([
      createChildSegment([createNameSelector(state.varname)]),
      createChildSegment([createWildcardSelector()]),
    ]),
  );
}

function childQuery(state: ApiSchemaState, name: string): string {
  return formatQuery(
    createQuery([
      createChildSegment([createNameSelector(state.varname)]),
      createChildSegment([createNameSelector(name)]),
    ]),
  );
}

function resolveSchema(context: ApiContext, schema: unknown): unknown {
  schema = traverseSchemaReference(context, schema);
  schema = resolveAllOfSchema(context, schema);
  return schema;
}

function resolveAllOfSchema(context: ApiContext, schema: unknown): unknown {
  if (!isObject(schema) || !isArray(schema.allOf)) {
    return schema;
  }

  let title: string | undefined;
  let description: string | undefined;
  let properties: { [key: string]: unknown } = {};

  for (let memberSchema of schema.allOf) {
    memberSchema = resolveSchema(context, memberSchema);
    if (!isObjectSchema(context, memberSchema)) {
      return schema;
    }
    if (title === undefined && typeof memberSchema.title === "string") {
      title = memberSchema.title;
    }
    if (
      description === undefined &&
      typeof memberSchema.description === "string"
    ) {
      description = memberSchema.description;
    }
    if (memberSchema.properties !== undefined) {
      for (let [key, value] of Object.entries(memberSchema.properties)) {
        properties[key] = value;
      }
    }
  }

  return {
    type: "object",
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    properties,
  };
}

/**
 * Traverses JSON Schema references, collecting the most specific title and
 * description properties along the way.
 *
 * @internal
 */
function traverseSchemaReference(
  context: ApiContext,
  schema: unknown,
): unknown {
  let title: string | undefined;
  let description: string | undefined;
  while (true) {
    if (isObject(schema)) {
      if (title === undefined && typeof schema.title === "string") {
        title = schema.title;
      }
      if (description === undefined && typeof schema.description === "string") {
        description = schema.description;
      }
    }
    const reference = getReference(context, schema);
    if (reference?.target === undefined) {
      break;
    }
    schema = reference.target;
  }
  return {
    ...(schema as object),
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
  };
}
