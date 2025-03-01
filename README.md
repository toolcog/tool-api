# Tool API

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/tool-api)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

A library that transforms OpenAPI specifications into Tool Handles for Large Language Models (LLMs). Tool API bridges the gap between API definitions and AI tools, enabling Tool Augmented Generation (TAG) at scale.

## Overview

Tool API solves a critical problem in the AI ecosystem: connecting LLMs to thousands of APIs without writing custom code for each endpoint. It achieves this by:

1. **Parsing OpenAPI specifications** with full support for OpenAPI 3.1
2. **Generating Tool Handles** that LLMs can easily understand and use
3. **Tree-shaking schemas** to create self-contained definitions
4. **Preserving documentation** for improved LLM comprehension
5. **Templating responses** to enhance LLM understanding of API outputs

This package is a part of the Tool Augmented Generation ([TAG]) ecosystem, which enables AI to interact with APIs without requiring bespoke code for each endpoint.

## Installation

```bash
# Install as a dependency in your project
npm install tool-api

# Or install globally to use the CLI
npm install -g tool-api
```

## Command Line Interface

Tool API includes a CLI for quickly generating Tool Handles from OpenAPI documents.

### List Operations

List all operations in an OpenAPI document:

```bash
tool-api list path/to/openapi.json
```

This command helps you explore an API before generating Tool Handles.

### Generate Tool Handles

Generate Tool Handles from an OpenAPI document:

```bash
tool-api generate path/to/openapi.json --output-dir ./tool-handle --format json
```

Options:

- `--output-dir, -o`: Output directory (default: `./`)
- `--format`: Output format (`json` or `yaml`, default: `json`)
- `--server-url`: Override the server URL for all operations
- `--include`: Only generate Tool Handles for operations matching this pattern
- `--exclude`: Skip operations matching this pattern
- `--tags`: Only include operations with specific tags (comma-separated)
- `--verbose, -v`: Print detailed information during processing
- `--dry-run`: Preview what would be generated without writing files
- `--overwrite`: Force overwrite if files already exist (default: `true`)
- `--skip-existing`: Skip generation if file already exists

### Batch Generation

Process multiple OpenAPI files in a single command:

```bash
tool-api batch --format json --output-dir ./tool-handles 'path/to/openapi/**/*.{json,yaml}'
```

The batch command supports the same options as `generate` and processes files in parallel for efficiency.

## Programmatic API

Tool API can be used programmatically to integrate Tool Handle generation into your workflows.

### Parse an OpenAPI Document

```typescript
import { parseApi } from "tool-api";

// Parse from a JavaScript object
const api = await parseApi(openApiObject);

// Access the API structure
console.log(`API version: ${api.openapi}`);
console.log(`API title: ${api.info?.title}`);

// Iterate through operations
for (const operation of api.operations()) {
  console.log(`${operation.method} ${operation.path}`);
  console.log(`Operation ID: ${operation.operationId}`);

  // Access parameters, request body, responses, etc.
  if (operation.parameters) {
    for (const param of operation.parameters) {
      console.log(`- Parameter: ${param.name} (${param.in})`);
    }
  }
}
```

### Generate a Tool Handle

```typescript
import { parseApi, generateApiHandle } from "tool-api";

// Parse the OpenAPI document
const api = await parseApi(openApiObject);

// Find a specific operation
let targetOperation;
for (const operation of api.operations()) {
  if (operation.operationId === "listRepositories") {
    targetOperation = operation;
    break;
  }
}

if (targetOperation) {
  // Generate a Tool Handle
  const handle = generateApiHandle(targetOperation, {
    // Optional: Override the server URL
    server: { url: "https://api.example.com" }
  });

  // The handle is now ready to use with an LLM
  console.log(JSON.stringify(handle, null, 2));
}
```

## How It Works

Tool API transforms OpenAPI operations into Tool Handles through a process that:

1. **Extracts metadata** from the OpenAPI operation (name, description, etc.)
2. **Builds parameter schemas** from path, query, header, and body parameters
3. **Creates request templates** that map parameters to HTTP requests
4. **Generates response templates** that structure API responses for LLMs
5. **Tree-shakes schemas** to include only what's needed for the operation

### Tool Handle Structure

A generated Tool Handle includes:

```javascript
{
  // Tool metadata
  "name": "listRepositories",
  "description": "List repositories for the authenticated user",

  // Parameter schema for the LLM
  "parameters": {
    "type": "object",
    "properties": {
      "visibility": {
        "type": "string",
        "description": "Filter repositories by visibility",
        "enum": ["all", "public", "private"]
      },
      // Other parameters...
    }
  },

  // Protocol handler
  "handler": "http",

  // Request template
  "request": {
    "method": "GET",
    "url": "https://api.github.com/user/repos",
    "query": {
      "visibility": {
        "$": "$.visibility"
      }
      // Other query parameters...
    }
    // Headers, authentication, etc.
  },

  // Response templates
  "responses": {
    "2XX": {
      "$encode": "markdown",
      "$block": [
        { "$h1": "Repositories" },
        "A list of repositories for the authenticated user.",
        {
          "$lang": "json",
          "$code": {
            "$encode": "json",
            "$indent": true,
            "$content": { "$": "$" }
          }
        }
      ]
    },
    // Other status codes...
  }
}
```

This structure contains everything needed to:

1. Present parameters to an LLM
2. Transform LLM-provided parameters into an HTTP request
3. Format the HTTP response for optimal LLM comprehension

### Schema Tree-Shaking

A key feature of Tool API is its ability to extract minimal, self-contained schemas:

```typescript
import { parseApi, generateApiHandle } from "tool-api";

// Generate a Tool Handle with tree-shaken schemas
const handle = generateApiHandle(operation);

// All referenced schemas are included directly in the parameter schema
console.log(handle.parameters);
```

This ensures that each Tool Handle is completely self-contained, without external references.

## Integration with TAG Ecosystem

Tool API is part of the Tool Augmented Generation ([TAG]) ecosystem:

- **[Tool Form]**: Structural transformation engine
- **[Tool Handle]**: Universal tool runtime
- **[HTTP Handle]**: HTTP protocol handler
- **[Toolpendium]**: A collection of 100,000+ Tool Handles

Together, these components enable AI systems to interact with thousands of APIs through a data-driven approach rather than custom code integration.

## Use Cases

Tool API unlocks powerful capabilities in the AI ecosystem:

1. **LLM Tool Libraries**: Generate tools for specific APIs that LLMs can use directly
2. **AI Agents**: Equip AI agents with the ability to access external services
3. **API Exploration**: Generate documentation and interfaces for exploring APIs
4. **No-Code Integration**: Connect AI to APIs without writing endpoint-specific code

## License

MIT © Tool Cognition Inc.

[TAG]: https://github.com/toolcog/tool-handle#readme
[Tool Handle]: https://github.com/toolcog/tool-handle/tree/main/packages/tool-handle#readme
[HTTP Handle]: https://github.com/toolcog/tool-handle/tree/main/packages/http#readme
[Tool Form]: https://github.com/toolcog/tool-form#readme
[Tool API]: https://github.com/toolcog/tool-api#readme
[Toolpendium]: https://github.com/toolcog/toolpendium#readme
