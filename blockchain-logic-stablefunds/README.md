# STABLE-FUNDS Stablecoin Platform

A Solana Anchor program that enables users to create custom stablecoins backed by collateral assets (specifically Etherfuse Stablebonds).

## Project Overview

The STABLE-FUNDS platform allows users to:

1. Create custom stablecoins with configurable parameters
2. Deposit collateral (Stablebonds, SOL, or USDC)
3. Mint stablecoin tokens based on collateralization ratio
4. Fetch available Etherfuse Stablebonds for use as collateral

## Core Components

### Anchor Program

The Anchor program provides the on-chain logic for:

- Stablecoin creation and initialization
- Collateral management
- Stablecoin minting based on collateralization ratio
- Integration with Etherfuse Stablebonds

### Account Structures

- `StablecoinConfig`: Stores stablecoin parameters (name, symbol, description, etc.)
- `StablecoinVault`: Holds the backing collateral for a stablecoin
- `UserStablecoin`: Tracks a user's stablecoin balance
- `UserCollateral`: Tracks a user's deposited collateral

### Instructions

- `create_stablecoin`: Initialize a new stablecoin with user-provided parameters
- `deposit_collateral`: Allow users to add collateral for their stablecoin
- `mint_stablecoin`: Mint new stablecoin tokens based on collateral value
- `fetch_stablebonds`: Query and retrieve available Etherfuse Stablebonds

## Frontend Integration

The Anchor program integrates with a React frontend application that provides:

- User interface for stablecoin creation
- Collateral selection and management
- Stablebond selection via Etherfuse SDK
- Transaction submission and confirmation

## Getting Started

### Prerequisites

- Rust and Cargo
- Solana CLI tools
- Anchor Framework
- Node.js and npm/yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/stable-funds.git
   cd stable-funds
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Build the Anchor program:
   ```
   anchor build
   ```

4. Deploy to Solana devnet:
   ```
   anchor deploy --provider.cluster devnet
   ```

5. Update the program ID in `Anchor.toml` and `lib.rs` with the deployed program ID.

6. Build and run the frontend:
   ```
   cd frontend
   yarn install
   yarn dev
   ```

## Usage

1. Connect your Solana wallet to the application
2. Navigate to the "Create Stablecoin" page
3. Fill in the stablecoin parameters (name, symbol, description, icon)
4. Select the collateral type (Stablebond, SOL, or USDC)
5. Set the collateralization ratio and initial supply
6. Submit the transaction to create your stablecoin
7. View your created stablecoins on the "Stablecoins" page

## Etherfuse Stablebond Integration

The platform integrates with the Etherfuse Stablebond SDK to:

1. Fetch available Stablebonds
2. Use Stablebonds as collateral for stablecoins
3. Calculate collateral value based on Stablebond price

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Etherfuse for providing the Stablebond SDK
- Solana Foundation for the blockchain infrastructure
- Anchor Framework for the Rust programming framework 