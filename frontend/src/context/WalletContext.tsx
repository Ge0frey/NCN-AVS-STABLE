import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface WalletContextProps extends WalletContextState {
  connection: Connection | null;
  network: WalletAdapterNetwork;
  balance: number;
  isLoading: boolean;
  isInitialized: boolean;
  setNetwork: (network: WalletAdapterNetwork) => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  console.log('WalletProvider: Rendering');
  
  const wallet = useWallet();
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  console.log('WalletProvider: State', {
    connected: wallet.connected,
    isInitialized,
    isLoading,
    network,
    hasConnection: !!connection,
    balance
  });

  // Initialize connection
  useEffect(() => {
    console.log('WalletProvider: Initializing connection');
    const initializeConnection = async () => {
      try {
        const endpoint = clusterApiUrl(network);
        const conn = new Connection(endpoint, 'confirmed');
        
        // Test connection
        await conn.getRecentBlockhash();
        
        setConnection(conn);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    initializeConnection();

    return () => {
      console.log('WalletProvider: Cleaning up connection');
    };
  }, [network]);

  // Update balance when wallet changes
  const refreshBalance = useCallback(async () => {
    console.log('WalletProvider: Refreshing balance');
    if (!wallet.publicKey || !connection) {
      setBalance(0);
      return;
    }
    
    try {
      setIsLoading(true);
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / 10 ** 9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => {
    console.log('WalletProvider: Wallet connection changed');
    if (wallet.connected) {
      refreshBalance();
    } else {
      setBalance(0);
    }
  }, [wallet.connected, refreshBalance]);

  const contextValue: WalletContextProps = {
    ...wallet,
    connection,
    network,
    balance,
    isLoading,
    isInitialized,
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