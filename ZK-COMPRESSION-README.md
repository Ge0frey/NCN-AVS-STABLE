# ZK Compression Integration for STABLE-FUNDS

This document outlines the ZK Compression features integrated into the STABLE-FUNDS application for the Breakout Hackathon.

## Overview

ZK Compression is a new primitive built on Solana that enables applications to scale by compressing on-chain state. By integrating ZK Compression, STABLE-FUNDS reduces state costs by orders of magnitude while preserving security, performance, and composability of the Solana L1.

## Features Implemented

### 1. Compressed Stablecoin Implementation

We've implemented compressed token mints for stablecoins, reducing the cost of creating and managing stablecoins by approximately 100x.

- **Location**: `frontend/src/services/compression-client.ts`
- **Features**:
  - Create compressed token mints
  - Mint compressed tokens
  - Transfer compressed tokens

### 2. Smart Vaults with Compressed State

Smart Vaults now support ZK Compression, allowing users to create vaults with significantly lower storage costs.

- **Location**: `frontend/src/services/compressed-vaults.ts`
- **Features**:
  - Create compressed vaults
  - Deposit to compressed vaults
  - Withdraw from compressed vaults

### 3. Compressed Collateral Accounts

Collateral accounts can now be compressed, reducing the cost of maintaining collateral positions.

- **Location**: `frontend/src/services/compressed-collateral.ts`
- **Features**:
  - Deposit collateral with compression
  - Withdraw collateral with compression
  - Query compressed collateral balances

## User Interface Enhancements

1. **Compression Toggle**: Added a global toggle in the app header to enable/disable ZK Compression features
2. **Compression Status**: Added a dashboard component showing compression stats and savings
3. **Compressed Collateral UI**: Enhanced deposit collateral page with compression options
4. **Compressed Smart Vaults UI**: Added compressed vaults management to the smart vaults page

## Technical Implementation

### Libraries Used

- **@lightprotocol/stateless.js**: Core ZK compression library for Solana
- **@lightprotocol/compressed-token**: Library for creating and managing compressed tokens

### Service Architecture

1. **Compression Client**: Base client for interacting with ZK Compression
2. **Configuration Service**: Manages compression feature flags and settings
3. **Domain-Specific Services**: Specialized services for stablecoins, vaults, and collateral

### Wallet Integration

Compression is integrated with the existing wallet context to ensure a seamless experience when switching between regular and compressed accounts.

## Cost Savings

| Operation | Regular Cost | Compressed Cost | Savings |
|-----------|--------------|-----------------|---------|
| Stablecoin Creation | ~0.01 SOL | ~0.0001 SOL | 100x |
| Smart Vault Creation | ~0.024 SOL | ~0.0002 SOL | 120x |
| Collateral Account | ~0.0016 SOL | ~0.00001 SOL | 160x |

## Future Enhancements

1. Full integration with on-chain program (currently using localStorage for demo)
2. Support for zero-knowledge proofs for private transactions
3. Advanced compression schemes for larger data structures

## Resources

- [ZK Compression Documentation](https://www.zkcompression.com/)
- [Light Protocol Monorepo](https://github.com/lightprotocol/light-protocol)
- [Solana Compressed Tokens](https://www.zkcompression.com/developers/creating-airdrops-with-compressed-tokens) 