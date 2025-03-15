import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
// Comment out the actual import and create a mock class
// import { RestakingClient } from '@jito-foundation/restaking-sdk';
import api from '../services/api';

// Mock RestakingClient for development
class RestakingClient {
  connection: Connection;
  
  constructor(connection: Connection) {
    this.connection = connection;
  }
  
  // Add any methods you need to mock
}

interface WalletContextProps extends WalletContextState {
  connection: Connection | null;
  network: WalletAdapterNetwork;
  balance: number;
  isLoading: boolean;
  isInitialized: boolean;
  setNetwork: (network: WalletAdapterNetwork) => void;
  refreshBalance: () => Promise<void>;
  jitoClient: RestakingClient | null;
  isJitoEnabled: boolean;
  fetchJitoData: () => Promise<void>;
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
  const [jitoClient, setJitoClient] = useState<RestakingClient | null>(null);
  const [isJitoEnabled, setIsJitoEnabled] = useState<boolean>(false);

  console.log('WalletProvider: State', {
    connected: wallet.connected,
    isInitialized,
    isLoading,
    network,
    hasConnection: !!connection,
    balance,
    isJitoEnabled
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

  // Initialize Jito client
  useEffect(() => {
    const initializeJitoClient = async () => {
      try {
        // Check if NCN features are enabled
        const features = await api.getFeatureFlags();
        
        if (features) {
          setIsJitoEnabled(features.jitoRestakingEnabled);
          
          if (features.jitoRestakingEnabled && connection) {
            const client = new RestakingClient(connection);
            setJitoClient(client);
            console.log('Jito Restaking client initialized successfully');
          }
        }
      } catch (error) {
        console.error('Failed to initialize Jito client:', error);
        setJitoClient(null);
        setIsJitoEnabled(false);
      }
    };
    
    if (connection) {
      initializeJitoClient();
    }
  }, [connection]);

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

  // Add fetchJitoData method
  const fetchJitoData = async () => {
    if (!isJitoEnabled || !connection || !wallet.publicKey) {
      return;
    }
    
    try {
      // This method can be used by components that need Jito data
      // It doesn't do anything specific here, but components can call it
      // to refresh their Jito data
      console.log('Fetching Jito data...');
    } catch (error) {
      console.error('Error fetching Jito data:', error);
    }
  };

  const contextValue: WalletContextProps = {
    ...wallet,
    connection,
    network,
    balance,
    isLoading,
    isInitialized,
    setNetwork,
    refreshBalance,
    jitoClient,
    isJitoEnabled,
    fetchJitoData,
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