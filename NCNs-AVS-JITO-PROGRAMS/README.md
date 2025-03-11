# NCN-AVS-JITO-PROGRAMS

This directory contains the NCN (Node Consensus Network) and Jito Restaking components for the STABLE-FUNDS platform. It leverages Cambrian SDK for consensus and Jito Restaking for economic security.

## Directory Structure

- **avs/**: Cambrian AVS (Actively Validated Service) configuration and setup
- **operators/**: Cambrian operator node configuration and setup
- **payloads/**: Cambrian payload containers for off-chain computations
- **bridge/**: Bridge layer for connecting the frontend with Cambrian SDK and Jito Restaking

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- Docker >= 20.0.0
- Cambrian CLI (installed globally)

```bash
npm i --global @cambrianone/camb-client@latest
```

### Setting Up the AVS

1. Initialize the AVS:

```bash
cd avs
camb init -t avs .
```

2. Start the AVS:

```bash
camb avs run -u <AVS pubkey>
```

### Setting Up Operators

1. Initialize operators:

```bash
cd operators
camb init -t operator operator1
camb init -t operator operator2
camb init -t operator operator3
```

2. Start operators:

```bash
camb operator run -u <voter public key>
```

### Building and Running Payloads

1. Build the price oracle payload:

```bash
cd payloads/price-oracle
docker build -t price-oracle-payload .
```

2. Run the payload:

```bash
camb payload run-container -a <AVS public key | AVS URL> price-oracle-payload
```

### Starting the Bridge Layer

1. Install dependencies:

```bash
cd bridge
npm install
```

2. Start the development server:

```bash
npm run dev
```

## Architecture

This implementation follows a modular architecture that separates concerns:

1. **Cambrian AVS**: Provides the coordination layer for the NCN
2. **Operator Nodes**: Run consensus and execute payloads
3. **Payload Containers**: Perform off-chain computations
4. **Bridge Layer**: Connects the frontend with the NCN infrastructure

## Integration with Frontend

The bridge layer provides API endpoints that the frontend can use to interact with the NCN and Jito Restaking features. This allows the frontend to remain largely unchanged while leveraging the new capabilities.

## License

ISC