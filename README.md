# STABLE-FUNDS with Cambrian NCN and Jito Restaking Integration

This project integrates the STABLE-FUNDS frontend application with Cambrian Node Consensus Network (NCN) and Jito Restaking backend services.

## Project Overview

The integration enables:

1. Decentralized oracle price feeds for collateral valuation
2. Jito Restaking capabilities for enhanced staking options
3. Decentralized governance proposal execution
4. NCN system health monitoring

## Setup Instructions

### Prerequisites

- Node.js v16+ and npm
- Solana CLI tools
- Cambrian CLI tools
- Docker (for payload containers)

### Bridge Layer Setup

1. Configure the Bridge Server:

```bash
cd NCNs-AVS-JITO-PROGRAMS/bridge

# Install dependencies
npm install

# Run the bridge in development mode
npm run dev
```

The bridge server will run on http://localhost:3001.

### Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run the development server:

```bash
npm run dev
```

The frontend will run on http://localhost:5173.

### AVS and Operator Setup

1. Set up Cambrian AVS:

```bash
# Navigate to AVS directory
cd NCNs-AVS-JITO-PROGRAMS/avs

# Initialize the AVS with Cambrian CLI
camb init -t avs .

# Start the AVS
camb avs run -u <AVS pubkey>
```

2. Set up Operators:

```bash
# Build the Oracle Update Container image
cd NCNs-AVS-JITO-PROGRAMS/oracle-update-examples/current-date/container-stream
docker build -t oracle-update-stable-funds .

# Initialize operators
cd NCNs-AVS-JITO-PROGRAMS/operators
camb init -t operator operator1
camb init -t operator operator2
camb init -t operator operator3

# Start the operators
camb operator run -u <voter public key for operator1>
camb operator run -u <voter public key for operator2>
camb operator run -u <voter public key for operator3>
```

3. Build and Deploy Payload Containers:

```bash
# Navigate to payload examples directory
cd NCNs-AVS-JITO-PROGRAMS/avs/payloads

# Build custom payloads for governance execution
docker build -t parameter-update-payload -f Dockerfile.parameter .
docker build -t program-upgrade-payload -f Dockerfile.upgrade .
docker build -t mint-approval-payload -f Dockerfile.mint .
```

## Testing

### Bridge Layer Testing

```bash
# Test endpoints with curl
curl http://localhost:3001/health
curl http://localhost:3001/api/features
curl http://localhost:3001/api/oracle/operators
curl http://localhost:3001/api/oracle/price/sol
curl http://localhost:3001/api/restaking/vaults
```

### Frontend Testing

1. Connect your wallet on the Connect page
2. Verify wallet connection status and balance display
3. Navigate to Collateral page to view oracle prices
4. Go to the Stake page to test Jito Restaking
5. Check the Governance page for proposal execution
6. View the Dashboard for NCN information

## Troubleshooting

### CORS Errors

- Verify the bridge server has CORS enabled
- Check the browser console for specific errors

### API Connection Issues

- Ensure the bridge server is running
- Check network connection between frontend and bridge

### Wallet Connection Problems

- Make sure wallet adapter is properly initialized
- Check if the wallet has the correct network selected

### Oracle Price Not Appearing

- Confirm NCN is enabled in the bridge `.env` file
- Verify AVS is running and accessible

### Jito Restaking Issues

- Ensure Jito Restaking is enabled in the bridge `.env` file
- Verify Solana RPC endpoint is accessible

## Production Deployment

For production deployment, follow these steps:

1. Build the bridge server:

```bash
cd NCNs-AVS-JITO-PROGRAMS/bridge
npm run build
```

2. Build the frontend:

```bash
cd frontend
npm run build
```

3. Deploy the built files to your production server.

## Security Considerations

- Implement rate limiting on the bridge API endpoints
- Add thorough validation of all user inputs
- Verify all transaction signatures on the server side
- Implement monitoring for oracle data and operator health

## License

This project is licensed under the MIT License - see the LICENSE file for details. 