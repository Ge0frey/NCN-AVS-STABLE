# STABLE-FUNDS Frontend

This is the frontend application for STABLE-FUNDS, a Solana-based platform for creating and managing stablecoins, handling collateral, and participating in Jito restaking.

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4.x with custom styling
- **Blockchain**: Solana Web3.js and Wallet Adapter
- **Routing**: React Router DOM 7.x

## Key Components

### Core Architecture

- **Context-based State Management**:
  - `WalletContext`: Manages Solana wallet connections, balances, and blockchain interactions
  - `ThemeContext`: Provides application-wide dark/light theme switching

- **Protected Routes**: Authentication system that redirects unauthenticated users and shows loading states during async operations

- **Responsive Layout System**:
  - `Layout`: Main layout wrapper with responsive sidebar
  - `Header`: Navigation and wallet connection UI
  - `Sidebar`: Main application navigation with collapsible menu
  - Glass panels and background effects for modern UI

### Features

- **Wallet Integration**:
  - Multiple wallet support (Phantom, Solflare, Ledger)
  - Wallet connection management
  - Balance display and transaction signing

- **Stablecoin Management**:
  - Stablecoin creation with custom parameters
  - Viewing and managing existing stablecoins
  - Market data visualization

- **Collateral Management**:
  - Deposit and withdraw collateral
  - Collateral ratio monitoring
  - Oracle price integration

- **Jito Restaking**:
  - Stake/unstake functionality
  - Restaking analytics
  - Vault management

- **Governance**:
  - Proposal viewing and voting

### Custom Hooks

- `useStableFunds`: Core hook for interacting with the STABLE-FUNDS protocol
- `useWalletContext`: Simplified wallet interaction hook

### Styling

- Futuristic UI with glassmorphism effects
- Responsive design with mobile-first approach
- Custom animations and transitions
- Dark/Light theme support

## Environment Setup

The application supports multiple environments:

- **Development**: Uses simulation and mock data options for easier testing
- **Production**: Connects to real Solana networks and disables simulation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

- `REACT_APP_SIMULATE_SUCCESS`: Enable/disable transaction simulation
- `REACT_APP_SOLANA_CLUSTER`: Set Solana cluster (devnet/mainnet)
- `REACT_APP_LOG_ENDPOINT`: Server endpoint for logging

## Project Structure

- `/src/components`: Reusable UI components
- `/src/context`: Application-wide state providers
- `/src/hooks`: Custom React hooks
- `/src/pages`: Page components for each route
- `/src/services`: Service modules for external interactions
- `/src/idl`: Anchor program interfaces
