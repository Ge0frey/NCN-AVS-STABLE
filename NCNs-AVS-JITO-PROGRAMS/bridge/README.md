# NCN-AVS Bridge Layer

This bridge layer connects the STABLE-FUNDS frontend with Cambrian SDK and Jito Restaking functionality. It provides a set of API endpoints that the frontend can use to interact with the NCN (Node Consensus Network) and Jito Restaking features.

## Features

- **Oracle Price Feeds**: Decentralized price feeds for collateral assets
- **Jito Restaking Integration**: Stake and unstake tokens in Jito vaults
- **Governance Execution**: Execute governance proposals using Cambrian payloads
- **Feature Flags**: Enable/disable NCN and Jito Restaking features

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- Docker >= 20.0.0
- Cambrian CLI (installed globally)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy the `.env.example` file to `.env` and update the values as needed.

### Development

Start the development server:

```bash
npm run dev
```

### Production

Build and start the production server:

```bash
npm run build
npm start
```

## API Endpoints

### Feature Status

- `GET /api/features`: Get the status of feature flags

### Oracle

- `GET /api/oracle/price/:assetId`: Get price data for a specific asset
- `GET /api/oracle/operators`: Get all NCN operators

### Restaking

- `GET /api/restaking/vaults`: Get all available Jito vaults
- `GET /api/restaking/positions/:walletAddress`: Get a user's staking positions
- `POST /api/restaking/stake`: Stake tokens to a Jito vault
- `POST /api/restaking/unstake`: Unstake tokens from a Jito vault

### Governance

- `POST /api/governance/execute`: Execute a governance proposal using Cambrian payload

## Architecture

This bridge layer follows an adapter pattern to connect the frontend with the Cambrian SDK and Jito Restaking functionality. It provides a set of services that abstract away the complexity of interacting with these components.

### Components

- **Services**: Interact with Cambrian SDK and Jito Restaking
- **Controllers**: Handle API requests and responses
- **Routes**: Define API endpoints
- **Utils**: Utility functions
- **Types**: TypeScript type definitions

## License

ISC 