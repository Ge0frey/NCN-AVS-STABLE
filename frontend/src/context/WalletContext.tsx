import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface WalletContextProps extends WalletContextState {
  connection: Connection | null;
  network: WalletAdapterNetwork;
  balance: number;
  isLoading: boolean;
  setNetwork: (network: WalletAdapterNetwork) => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize connection
  useEffect(() => {
    const endpoint = clusterApiUrl(network);
    const conn = new Connection(endpoint, 'confirmed');
    setConnection(conn);
  }, [network]);

  // Update balance when wallet changes
  useEffect(() => {
    if (wallet.publicKey && connection) {
      refreshBalance();
    } else {
      setBalance(0);
    }
  }, [wallet.publicKey, connection, wallet.connected]);

  const refreshBalance = async () => {
    if (!wallet.publicKey || !connection) return;
    
    try {
      setIsLoading(true);
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / 10 ** 9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: WalletContextProps = {
    ...wallet,
    connection,
    network,
    balance,
    isLoading,
    setNetwork,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
} 