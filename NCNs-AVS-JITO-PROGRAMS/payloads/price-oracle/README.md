# Price Oracle Payload

This is a Cambrian payload container for updating price oracle data. It fetches price data from external sources and submits it to the Cambrian Consensus Program.

## Overview

The payload container:

1. Fetches price data from external APIs
2. Creates a Solana transaction to update the oracle program
3. Returns the transaction instructions to the Cambrian operator

## Building the Container

```bash
docker build -t price-oracle-payload .
```

## Usage

This container is designed to be run by Cambrian operators. It receives input via the `PAYLOAD_INPUT` environment variable and outputs the proposal instructions to stdout.

### Input Format

```json
{
  "executorPDA": "string",
  "apiUrl": "string",
  "extraSigners": ["string"],
  "poaName": "string",
  "proposalStorageKey": "string"
}
```

### Output Format

```json
{
  "proposalInstructions": [
    {
      "accounts": [
        {
          "address": "string",
          "role": 0 | 1 | 2 | 3
        }
      ],
      "data": "string",
      "programmAddress": "string"
    }
  ]
}
```

## Development

### Prerequisites

- Node.js >= 22.0.0
- TypeScript

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

### Running Locally

```bash
npm start
```

## License

ISC 