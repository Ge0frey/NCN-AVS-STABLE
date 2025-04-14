# Civic Auth Integration

This project integrates Civic Auth to provide a seamless authentication experience with embedded wallets. The integration allows users to authenticate using email, Google, or social accounts while automatically creating Solana wallets for them.

## Features

- **Flexible Authentication**: Users can sign in using email, Google, passkeys, or connect their existing wallets
- **Embedded Wallets**: Automatic wallet creation for users who don't have one
- **Seamless Integration**: Works alongside traditional wallet connections
- **Multi-chain Support**: Works on Solana, as well as EVM-compatible chains

## Setup Instructions

1. **Create a Civic Auth Account**:
   - Visit [auth.civic.com](https://auth.civic.com/dashboard) to sign up
   - Create a new application and enable the Web3 Wallet option

2. **Get Your Client ID**:
   - Copy your Client ID from the Civic Auth dashboard

3. **Configure Environment Variables**:
   - Update the `.env.development` and `.env.production` files with your Civic client ID:
     ```
     VITE_CIVIC_CLIENT_ID=your_client_id_here
     ```

4. **Run the Application**:
   ```bash
   npm install
   npm run dev
   ```

## Implementation Details

The Civic Auth integration consists of several key components:

1. **CivicAuthContext**: Manages authentication state and provides access to the embedded wallet
2. **CivicWalletAdapter**: Implements the Solana wallet adapter interface for Civic's embedded wallet
3. **CombinedWalletProvider**: Integrates both traditional wallet connections and Civic Auth
4. **WalletDisplay**: Shows information about the connected wallets and authentication status

## Usage

Users can authenticate in one of two ways:

1. **Civic Auth**: Click the Civic option on the connect page to sign in with email, Google, or social accounts. An embedded wallet will be automatically created.
2. **Traditional Wallets**: Connect an existing wallet like Phantom, Solflare, etc.

## Development Notes

- The Civic embedded wallet is implemented as a standard Solana wallet adapter, making it compatible with all existing wallet operations
- Users can be authenticated through either method, providing flexibility
- The `ProtectedRoute` component has been updated to check for either traditional wallet connection or Civic Auth authentication
- The dashboard displays information about both authentication methods and their associated wallets

## Troubleshooting

If you encounter issues:

1. Ensure your Civic Auth client ID is correctly set in the environment variables
2. Check that you've enabled the Web3 wallet option in your Civic Auth dashboard
3. For development, you may want to use the devnet network configuration in Civic Auth dashboard

## Resources

- [Civic Auth Documentation](https://docs.civic.com/auth)
- [Civic Web3 Documentation](https://docs.civic.com/auth/web3/embedded-wallets)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter) 