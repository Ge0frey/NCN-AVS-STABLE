import { ReactNode, useEffect, useMemo, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { CivicAuthProvider as OriginalCivicAuthProvider } from '@civic/auth-web3/react';
import { CivicAuthProvider, useCivicAuth } from './CivicAuthContext';
import { CivicWalletAdapter } from '../utils/CivicWalletAdapter';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// First wrap the application with CivicAuthProvider
export function CombinedWalletRootProvider({ children }: { children: ReactNode }) {
  return (
    <CivicAuthProvider>
      <CombinedWalletProviderInner>
        {children}
      </CombinedWalletProviderInner>
    </CivicAuthProvider>
  );
}

// Inner component that has access to CivicAuthContext
function CombinedWalletProviderInner({ children }: { children: ReactNode }) {
  const { embeddedWallet, isAuthenticated } = useCivicAuth();
  const [civicAdapter, setCivicAdapter] = useState<CivicWalletAdapter | null>(null);
  
  // Set up network
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Set up traditional wallet adapters
  const otherWallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter()
    ],
    []
  );
  
  // Create or update Civic wallet adapter when embedded wallet changes
  useEffect(() => {
    if (isAuthenticated && embeddedWallet) {
      if (!civicAdapter) {
        // Create new adapter if it doesn't exist
        const adapter = new CivicWalletAdapter(embeddedWallet);
        setCivicAdapter(adapter);
      } else {
        // Update existing adapter
        civicAdapter.setWallet(embeddedWallet);
      }
    } else if (civicAdapter) {
      // Disconnect adapter when embedded wallet is not available
      civicAdapter.setWallet(null);
    }
  }, [embeddedWallet, isAuthenticated, civicAdapter]);
  
  // Combine all wallets
  const wallets = useMemo(() => {
    if (civicAdapter) {
      return [civicAdapter, ...otherWallets];
    }
    return otherWallets;
  }, [civicAdapter, otherWallets]);
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 