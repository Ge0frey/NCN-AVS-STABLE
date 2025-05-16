
# STABLE-FUNDS Platform

STABLE-FUNDS is a decentralized finance (DeFi) platform built on Solana that enables users to create, manage, and interact with overcollateralized stablecoins. The platform leverages Solana's high throughput and low fees to provide a seamless user experience for stablecoin operations, collateral management, and governance.

## Access Platform

https://stablefunds-ncns.vercel.app/

## Features

### Core Functionality

- **Stablecoin Creation**: Create custom stablecoins backed by various collateral types
- **Collateral Management**: Deposit and withdraw collateral assets with real-time health monitoring
- **Minting and Redemption**: Mint new stablecoins or redeem them for collateral
- **Staking**: Stake tokens to earn rewards and participate in governance
- **Governance**: Vote on proposals and protocol parameters

### Advanced Features

#### ZK Compression Integration

STABLE-FUNDS leverages ZK Compression technology to drastically reduce storage costs:

- **Compressed Stablecoins**: Create stablecoins with 100x lower storage costs
- **Compressed Smart Vaults**: Deploy vaults with minimal on-chain footprint
- **Compressed Collateral**: Manage collateral positions at a fraction of regular costs
- **Toggle Mechanism**: Users can enable/disable compression features via UI

#### Smart Vaults - Automated Yield Strategies

Smart Vaults automatically deploy idle collateral into yield-generating strategies while maintaining overcollateralization:

- **Customizable Risk Profiles**: Choose from conservative to aggressive yield allocations
- **Strategy Options**: From low-risk (4-6% APY) to high-yield (20-30% APY)
- **Real-time Yield Tracking**: Monitor performance with detailed analytics
- **Auto-compounding**: Maximize returns through automatic reinvestment
- **Strategy Rebalancing**: Adapt to changing market conditions
- **Instant Withdrawal**: Access collateral quickly when needed

#### Liquidation Protection System

An innovative solution that monitors collateral health ratios and proactively protects positions:

- **Real-time Monitoring**: Continuous tracking with configurable thresholds
- **Multiple Protection Modes**: Auto-repay, add collateral, or combined approach
- **Historical Tracking**: Visualize health ratio changes over time
- **Protection Action History**: Detailed logs of all protection events
- **Customizable Parameters**: Set maximum protection amounts and cooldown periods
- **Notification System**: Get alerts when positions need attention

#### Node Consensus Network (NCN)

A decentralized oracle network providing reliable price feeds:

- **Decentralized Price Oracles**: Resistant to manipulation through consensus
- **Multiple Operators**: Distributed architecture for reliability
- **Real-time Price Updates**: Current market data for all supported assets
- **Verification System**: Multi-layer validation of oracle data

#### Jito Restaking Integration

Enhanced staking mechanism through Jito's restaking infrastructure:

- **Multiple Staking Vaults**: Various options with different yield profiles
- **Lock Periods**: Optional locks for higher yields
- **Automated Rewards**: Streamlined reward distribution
- **Enhanced Security**: Additional protocol security through economic incentives

### User Experience

- **Civic Auth Integration**: Seamless authentication with embedded wallets
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Real-time Analytics**: Comprehensive dashboards and reporting
- **Transaction Monitoring**: Track all protocol interactions

## Architecture

STABLE-FUNDS consists of four main components:

### 1. Frontend Application

A modern React-based application providing the user interface:

- **Technology Stack**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **State Management**: React Context API
- **Routing**: React Router v7
- **Wallet Integration**: Solana Wallet Adapter with multiple wallet support
- **Authentication**: Civic Auth for email/social login with embedded wallets
- **Data Visualization**: Recharts for analytics displays

### 2. Solana Programs

On-chain programs handling the core logic of the platform:

- **Framework**: Anchor 0.31.0
- **Language**: Rust
- **Main Components**:
  - Stablecoin creation and management
  - Collateral handling
  - Smart Vaults implementation
  - Liquidation Protection System

### 3. NCN-AVS Integration

Node Consensus Network and Actively Validated Service components:

- **Oracle Network**: Cambrian SDK for decentralized price feeds
- **AVS Structure**:
  - Coordination layer for consensus
  - Multiple operator nodes for redundancy
  - Custom payloads for specific computations
- **Payload Containers**: Dockerized environments for off-chain computations

### 4. Bridge Layer

API service connecting the frontend with NCN and Jito services:

- **Server**: Express.js with TypeScript
- **Features**:
  - Oracle data relay
  - Restaking operations
  - Governance execution
  - Feature flag management

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

### Complete Environment Setup

For convenience, use the included start script:
```bash
./start-services.sh
```

This will start all necessary services and provide log locations.

## Key Components

### Authentication System

STABLE-FUNDS provides two authentication methods:

1. **Traditional Wallet Connection**: Connect existing wallets like Phantom or Solflare
2. **Civic Auth**: Sign in with email, Google, or social accounts with automatic wallet creation

The authentication system is implemented in:
- `frontend/src/context/CivicAuthContext.tsx`
- `frontend/src/utils/CivicWalletAdapter.ts`
- `frontend/src/components/auth/ProtectedRoute.tsx`

### Stablecoin Management

Users can create, mint, and redeem stablecoins with customizable parameters:

1. **Creation**: Set name, symbol, collateral type, and collateralization ratio
2. **Minting**: Issue new stablecoins against deposited collateral
3. **Redemption**: Return stablecoins for underlying collateral

Key implementation files:
- `stablefunds_program/programs/stablefunds_program/src/lib.rs`
- `frontend/src/pages/CreateStablecoinPage.tsx`
- `frontend/src/pages/MintPage.tsx`
- `frontend/src/pages/RedeemPage.tsx`

### Collateral Management

The platform supports multiple collateral types with comprehensive management tools:

1. **Deposit**: Add collateral to secure stablecoin issuance
2. **Monitor**: Track health ratios and collateral value
3. **Withdraw**: Remove excess collateral when overcollateralized

Relevant files:
- `frontend/src/pages/CollateralPage.tsx`
- `frontend/src/pages/DepositCollateralPage.tsx`
- `frontend/src/pages/WithdrawCollateralPage.tsx`

### Smart Vaults

Automated yield generation for collateral with configurable strategies:

1. **Vault Creation**: Set risk level and auto-compound preferences
2. **Strategy Allocation**: Distribute collateral across multiple strategies
3. **Yield Tracking**: Monitor performance metrics
4. **Rebalancing**: Adjust strategy allocations as needed

Implementation in:
- `stablefunds_program/programs/stablefunds_program/src/smart_vaults.rs`
- `frontend/src/components/staking/SmartVaults.tsx`

### Liquidation Protection

Proactive protection for collateralized positions:

1. **Configuration**: Set protection thresholds and modes
2. **Monitoring**: Continuous health ratio tracking
3. **Automatic Intervention**: Execute protection actions when needed
4. **History Tracking**: Record all protection events

Implementation in:
- `stablefunds_program/programs/stablefunds_program/src/liquidation_protection.rs`
- `frontend/src/components/staking/LiquidationProtection.tsx`

### ZK Compression

Storage optimization through zero-knowledge compression:

1. **Compressed Tokens**: Create and manage compressed stablecoins
2. **Compressed Vaults**: Low-cost Smart Vault deployment
3. **Compressed Collateral**: Efficient collateral management

Key files:
- `frontend/src/services/compression-client.ts`
- `frontend/src/services/compressed-vaults.ts`
- `frontend/src/services/compressed-collateral.ts`
- `frontend/src/components/CompressionToggle.tsx`

### Oracle Network

Decentralized price feeds from the Node Consensus Network:

1. **Operator Nodes**: Distributed validators providing price data
2. **Consensus Mechanism**: Ensure accurate and manipulation-resistant data
3. **Bridge Integration**: Connect oracle data to frontend applications

Implementation in:
- `NCNs-AVS-JITO-PROGRAMS/bridge/src/services/cambrianService.ts`
- `NCNs-AVS-JITO-PROGRAMS/operators/payload-images/check-oracle/`

### Restaking

Enhanced staking through Jito Restaking:

1. **Vault Selection**: Choose from multiple staking vaults
2. **Position Management**: Track and manage staking positions
3. **Rewards**: Earn enhanced yields on staked assets

Implementation in:
- `NCNs-AVS-JITO-PROGRAMS/bridge/src/services/jitoRestakingService.ts`
- `frontend/src/pages/StakePage.tsx`

### Governance

Decentralized protocol governance:

1. **Proposal Creation**: Submit proposals for protocol changes
2. **Voting**: Cast votes on active proposals
3. **Execution**: Implement approved proposals

Implementation in:
- `frontend/src/pages/GovernancePage.tsx`
- `NCNs-AVS-JITO-PROGRAMS/bridge/src/api/controllers/governanceController.ts`

## Deployment

### Frontend Deployment

The frontend can be deployed to Vercel by:
1. Connecting your GitHub repository to Vercel
2. Setting up build configuration
3. Adding environment variables

### Program Deployment

Deploy Solana programs using Anchor:
```bash
anchor deploy --program-id <PROGRAM_ID> --provider.cluster devnet
```

For mainnet:
```bash
anchor deploy --program-id <PROGRAM_ID> --provider.cluster mainnet-beta
```

### NCN and Bridge Deployment

1. Deploy the bridge service on a reliable host:
   ```bash
   cd NCNs-AVS-JITO-PROGRAMS/bridge
   npm run build
   npm start
   ```

2. Deploy AVS and operators on separate instances for redundancy.

## Security Considerations

- All Solana programs undergo security audits before mainnet deployment
- User funds are protected by overcollateralization mechanisms
- Price oracle data is secured through decentralized consensus
- Critical operations require signature verification
- Liquidation Protection provides an additional security layer

## Future Development

Planned enhancements include:

1. **Cross-chain Integration**: Support for bridging stablecoins to other blockchains
2. **Advanced Governance**: DAO-based governance with timelock mechanisms
3. **Mobile Application**: Native mobile clients for iOS and Android
4. **Enhanced Analytics**: Advanced visualization and reporting tools
5. **Integration with DeFi Protocols**: Composability with leading DeFi platforms

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

- [Solana](https://solana.com/) for the blockchain infrastructure
- [Anchor](https://www.anchor-lang.com/) for the Solana development framework
- [Jito](https://jito.network/) for restaking infrastructure
- [Cambrian](https://cambrian.one/) for the consensus network tools
- [Civic](https://www.civic.com/) for authentication services
- [Light Protocol](https://www.lightprotocol.com/) for ZK compression technology

---

For more details on implementation specifics, please refer to the [Frontend Integration Guide](./NCNs-AVS-JITO-PROGRAMS/FRONTEND_INTEGRATION.md) or contact the development team.
