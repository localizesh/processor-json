# @localizesh/processor-json

JSON processor for the localize.sh ecosystem. This package parses JSON files into a localization-friendly AST (Abstract Syntax Tree) and stringifies them back, preserving structure while allowing content extraction.

## Installation

```bash
npm install @localizesh/processor-json
```

## Usage

### As a Library

```typescript
import JsonProcessor from "@localizesh/processor-json";

const processor = new JsonProcessor();

const jsonContent = '{"hello": "world"}';
// Parse into a Document (AST + Segments)
const document = processor.parse(jsonContent);

// ... modify document segments ...

// Stringify back to JSON
const newJsonContent = processor.stringify(document);
```

### As a CLI

This package provides a binary `localize-processor-json` that works with standard I/O. It reads a protobuf `ParseRequest` or `StringifyRequest` from stdin and writes a `ParseResponse` or `StringifyResponse` to stdout, making it compatible with the localize.sh plugin system.


## Features

- **Flattening**: Flattens JSON objects into dotted keys for clear localization context (e.g., `menu.header.title`).
- **Array Support**: correctly handles arrays using `..` notation (e.g., `items..0.name`) to distinguish them from numeric object keys.
- **Round-trip**: Ensures that parsing and then stringifying results in the original JSON structure.

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## License

[Apache-2.0](LICENSE)

