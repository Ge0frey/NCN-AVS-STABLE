# DEMO VIDEO: https://youtu.be/XjkXvFRxpNE
## Access platform from - https://stablefunds-ncns.vercel.app/

# STABLE-FUNDS Platform

STABLE-FUNDS is a decentralized finance (DeFi) platform built on Sonic that enables users to create, manage, and interact with overcollateralized stablecoins. The platform leverages Sonic's high throughput and low fees to provide a seamless user experience for stablecoin operations, collateral management, and governance.

## Features

- **Stablecoin Creation**: Create custom stablecoins backed by various collateral types
- **Collateral Management**: Deposit and withdraw collateral assets with real-time health monitoring
- **Minting and Redemption**: Mint new stablecoins or redeem them for collateral
- **Staking**: Stake tokens to earn rewards and participate in governance
- **Governance**: Vote on proposals and protocol parameters
- **Decentralized Oracle Network**: Price feeds provided by Node Consensus Network (NCN)
- **Restaking Integration**: Enhanced yields through Jito Restaking mechanism
- **Smart Vaults**: Optimize yield on collateral with automated strategies while maintaining overcollateralization
- **Liquidation Protection System**: Proactively protect positions from liquidation with automated monitoring and intervention
- **Responsive UI**: Modern interface that works across desktop and mobile devices

## NEW FEATURES (Added for Sonic Mobius Hackathon)

### 1. Smart Vaults - Automated Yield Strategies for Collateral

Smart Vaults automatically deploy idle collateral into yield-generating strategies while maintaining the security of overcollateralized stablecoins. This solves a critical capital efficiency problem in DeFi - idle collateral not generating returns.

Key capabilities:
- Customizable risk profiles for yield allocation
- Multiple strategy options from low-risk (4-6% APY) to high-yield (20-30% APY)
- Real-time yield tracking and projections
- Auto-compounding option for maximum returns
- Strategy rebalancing based on market conditions
- Maintains collateral security with instant withdrawal capability

### 2. Liquidation Protection System

An innovative solution that monitors collateral health ratios and proactively protects positions from liquidation through automated intervention. This system leverages Sonic's high-performance infrastructure to provide peace of mind to stablecoin issuers.

Key capabilities:
- Real-time health ratio monitoring with configurable thresholds
- Multiple protection modes: auto-repay, add collateral, or both
- Historical health ratio tracking and visualization
- Detailed protection action history
- Customizable protection parameters (max protection amount, cooldown period)
- Manual protection option for user control
- Notification-only mode for users who prefer manual intervention

## Architecture

STABLE-FUNDS consists of three main components:

### 1. Frontend Application

A React-based application built with TypeScript, Vite, and Tailwind CSS that provides the user interface for interacting with the platform.

- **Technology Stack**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **State Management**: React Context API
- **Routing**: React Router v7
- **Wallet Integration**: Solana Wallet Adapter (Phantom, Solflare, Ledger)
- **Data Visualization**: Recharts

### 2. Solana Programs

On-chain programs that handle the core logic of the platform, including stablecoin creation, collateral management, and token operations.

- **Framework**: Anchor 0.31.0
- **Language**: Rust
- **Testing**: TypeScript-based tests
- **Deployment-cluster**: https://api.testnet.sonic.game


### 3. NCN and AVS Integration

Node Consensus Network and Actively Validated Service components that provide decentralized price feeds and additional security through Jito Restaking.

- **Oracle Network**: Cambrian SDK for consensus on asset prices
- **Restaking**: Jito Restaking for enhanced economic security
- **Bridge Layer**: API service connecting the frontend with NCN and Jito services

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- Rust >= 1.75.0
- Solana CLI >= 1.18.0
- Anchor CLI >= 0.31.0
- Docker (for running NCN components)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - For development, modify `.env.development`
   - For production, modify `.env.production`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production build:
   ```bash
   npm run build
   ```

### Solana Program Setup

1. Navigate to the stablefunds_program directory:
   ```bash
   cd stablefunds_program
   ```

2. Build the Anchor program:
   ```bash
   anchor build
   ```

3. Run tests:
   ```bash
   anchor test
   ```

4. Deploy to a Solana cluster:
   ```bash
   anchor deploy
   ```

### NCN-AVS Setup

1. Install Cambrian CLI:
   ```bash
   npm i --global @cambrianone/camb-client@latest
   ```

2. Start the bridge service:
   ```bash
   cd NCNs-AVS-JITO-PROGRAMS/bridge
   npm install
   npm run dev
   ```

3. Initialize and run the AVS:
   ```bash
   cd NCNs-AVS-JITO-PROGRAMS/avs
   camb init -t avs .
   camb avs run -u <AVS pubkey>
   ```

4. Set up operators:
   ```bash
   cd NCNs-AVS-JITO-PROGRAMS/operators
   camb init -t operator operator1
   camb operator run -u <voter public key>
   ```

## Component Breakdown

### Stablecoin Creation

Users can create new stablecoins by:
1. Choosing a collateral type (SOL, Stablebond, or USDC)
2. Setting parameters like collateralization ratio
3. Depositing initial collateral
4. Defining stablecoin metadata (name, symbol, icon)

### Collateral Management

The platform provides tools to:
- Monitor collateral health ratio
- Deposit additional collateral to prevent liquidation
- Withdraw excess collateral when overcollateralized
- View historical collateral value

### Minting and Redemption

Users can:
- Mint new stablecoins against their deposited collateral
- Redeem stablecoins to reclaim collateral
- View minting capacity based on current collateral value

### Governance

The governance system allows token holders to:
- Create proposals for protocol changes
- Vote on active proposals
- Execute approved proposals through decentralized execution

### Node Consensus Network

The NCN provides:
- Decentralized price feeds for collateral assets
- Verification of oracle data through multiple operators
- Resistance to manipulation through consensus mechanisms

### Jito Restaking

Integration with Jito provides:
- Enhanced staking yields
- Additional economic security
- Multiple staking vaults with different lockup periods

## Development Workflow

1. Make changes to the frontend or Solana programs
2. Run tests to ensure functionality
3. Deploy updated programs to testnet for integration testing
4. Test frontend against deployed programs
5. Once verified, deploy to production

## Deployment

### Frontend Deployment

The frontend can be deployed to Vercel by:
1. Connecting your GitHub repository to Vercel
2. Setting up build configuration
3. Adding environment variables

### Program Deployment

Deploy Solana programs using Anchor:
```bash
anchor deploy --program-id <PROGRAM_ID> --provider.cluster testnet
```
For mainnet:
```bash
anchor deploy --program-id <PROGRAM_ID> --provider.cluster mainnet-beta
```

## Security Considerations

- All Solana programs undergo security audits before mainnet deployment
- User funds are protected by overcollateralization mechanisms
- Price oracle data is secured through decentralized consensus
- Critical operations require signature verification

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure no regressions
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgements

- [Sonic](https://www.sonic.game/) for the high-performance blockchain infrastructure
- [Anchor](https://www.anchor-lang.com/) for the Solana development framework
- [Jito](https://jito.network/) for restaking infrastructure
- [Cambrian](https://cambrian.one/) for the consensus network tools

---

For more details on implementation specifics, please refer to the [Frontend Integration Guide](./NCNs-AVS-JITO-PROGRAMS/FRONTEND_INTEGRATION.md) or contact me.
