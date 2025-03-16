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
  // Reduce console logging to avoid excessive output
  const debug = false;
  const logDebug = (message: string, data?: any) => {
    if (debug) {
      console.log(message, data);
    }
  };
  
  logDebug('WalletProvider: Rendering');
  
  const wallet = useWallet();
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [jitoClient, setJitoClient] = useState<RestakingClient | null>(null);
  const [isJitoEnabled, setIsJitoEnabled] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  logDebug('WalletProvider: State', {
    connected: wallet.connected,
    isInitialized,
    isLoading,
    network,
    hasConnection: !!connection,
    balance,
    isJitoEnabled,
    connectionAttempts
  });

  // Initialize connection with retry logic and timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    logDebug('WalletProvider: Initializing connection');
    
    const initializeConnection = async () => {
      if (!isMounted) return;
      
      try {
        const endpoint = clusterApiUrl(network);
        const conn = new Connection(endpoint, 'confirmed');
        
        // Test connection with timeout
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 5000);
        });
        
        const connectionPromise = conn.getRecentBlockhash();
        
        await Promise.race([connectionPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        setConnection(conn);
        setIsInitialized(true);
        setConnectionAttempts(0);
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        
        if (!isMounted) return;
        
        // Retry with exponential backoff, but only up to 3 times
        if (connectionAttempts < 3) {
          const delay = Math.pow(2, connectionAttempts) * 1000;
          console.log(`Retrying connection in ${delay}ms (attempt ${connectionAttempts + 1}/3)`);
          
          setTimeout(() => {
            if (isMounted) {
              setConnectionAttempts(prev => prev + 1);
            }
          }, delay);
        } else {
          // After 3 attempts, set initialized anyway to not get stuck
          console.log('Maximum connection attempts reached, proceeding anyway');
          setIsInitialized(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    initializeConnection();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      logDebug('WalletProvider: Cleaning up connection');
    };
  }, [network, connectionAttempts]);

  // Initialize Jito client - with error handling to avoid blocking the app
  useEffect(() => {
    let isMounted = true;
    
    const initializeJitoClient = async () => {
      if (!connection || !isMounted) return;
      
      try {
        // Use a timeout for the API call to prevent blocking
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Feature flags request timeout'));
          }, 3000);
        });
        
        const featuresPromise = api.getFeatureFlags();
        const features = await Promise.race([featuresPromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        if (features) {
          setIsJitoEnabled(features.jitoRestakingEnabled);
          
          if (features.jitoRestakingEnabled && connection) {
            const client = new RestakingClient(connection);
            setJitoClient(client);
            logDebug('Jito Restaking client initialized successfully');
          }
        }
      } catch (error) {
        console.error('Failed to initialize Jito client:', error);
        if (isMounted) {
          setJitoClient(null);
          setIsJitoEnabled(false);
        }
      }
    };
    
    if (connection) {
      initializeJitoClient();
    }
    
    return () => {
      isMounted = false;
    };
  }, [connection]);

  // Update balance when wallet changes
  const refreshBalance = useCallback(async () => {
    logDebug('WalletProvider: Refreshing balance');
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
    logDebug('WalletProvider: Wallet connection changed');
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
      logDebug('Fetching Jito data...');
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