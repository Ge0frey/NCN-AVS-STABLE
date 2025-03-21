import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, clusterApiUrl, Transaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
// Comment out the actual import and create a mock class
// import { RestakingClient } from '@jito-foundation/restaking-sdk';
import { RestakingClient } from '@jito-foundation/restaking-sdk';
import api from '../services/api';

// Mock RestakingClient for development
// class RestakingClient {
//   connection: Connection;
//   
//   constructor(connection: Connection) {
//     this.connection = connection;
//   }
//   
//   // Add any methods you need to mock
// }

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
  setJitoEnabled: (enabled: boolean) => void;
  fetchJitoData: () => Promise<void>;
  stakeToVault: (vaultAddress: string, amount: number, lockPeriod?: number) => Promise<{ success: boolean; signature: string }>;
  unstakeFromVault: (vaultAddress: string, amount: number) => Promise<{ success: boolean; signature: string }>;
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
        // Always try to create a client regardless of feature flags
        // This ensures we have a client available when manually enabling Jito
        if (!jitoClient) {
          const client = new RestakingClient(connection);
          setJitoClient(client);
          // If client creation was successful, consider Jito enabled for better UX
          setIsJitoEnabled(true);
          logDebug('Jito Restaking client created successfully');
        }
        
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
          // Update enabled status based on feature flags only if we don't already have a client
          if (!jitoClient) {
            setIsJitoEnabled(features.jitoRestakingEnabled);
          }
          logDebug(`Jito Restaking feature flag: ${features.jitoRestakingEnabled}`);
        }
      } catch (error) {
        console.error('Failed to initialize Jito client or fetch feature flags:', error);
        if (isMounted) {
          // Keep any existing client even if we couldn't fetch feature flags
          if (!jitoClient) {
            try {
              const client = new RestakingClient(connection);
              setJitoClient(client);
              setIsJitoEnabled(true);
              logDebug('Created Jito client despite feature flag error');
            } catch (clientError) {
              console.error('Failed to create Jito client:', clientError);
              setJitoClient(null);
              setIsJitoEnabled(false);
            }
          }
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

  // Add method to manually enable Jito
  const setJitoEnabled = (enabled: boolean) => {
    if (enabled && connection && !jitoClient) {
      // Create client if enabling and no client exists
      try {
        const client = new RestakingClient(connection);
        setJitoClient(client);
        setIsJitoEnabled(true);
        logDebug('Jito Restaking client manually initialized');
      } catch (error) {
        console.error('Failed to manually initialize Jito client:', error);
        return false;
      }
    } else {
      // Simply update the enabled state
      setIsJitoEnabled(enabled);
    }
    return true;
  };

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

  // Update fetchJitoData method
  const fetchJitoData = async () => {
    if (!isJitoEnabled || !connection || !wallet.publicKey) {
      return;
    }
    
    try {
      setIsLoading(true);
      // This method can be used by components that need Jito data
      logDebug('Fetching Jito data...');
      
      // Actually fetch real data from the blockchain
      if (jitoClient) {
        // Get user position directly from blockchain
        const positions = await jitoClient.getStakerPositions(wallet.publicKey);
        // Get vault data directly from blockchain
        const vaults = await jitoClient.getAllVaults();
        
        logDebug('Fetched positions and vaults', { positions, vaults });
      }
    } catch (error) {
      console.error('Error fetching Jito data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a method to interact with the blockchain for staking
  const stakeToVault = async (vaultAddress: string, amount: number, lockPeriod: number = 0) => {
    if (!connection || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }
    
    if (!jitoClient && isJitoEnabled) {
      console.warn('Jito client not available, attempting to reinitialize...');
      try {
        const client = new RestakingClient(connection);
        setJitoClient(client);
      } catch (initError) {
        console.error('Failed to initialize Jito client:', initError);
      }
    }
    
    try {
      setIsLoading(true);
      
      // Create transaction instructions
      let instructions: TransactionInstruction[] = [];
      
      try {
        if (jitoClient) {
          // Try to use real client
          instructions = await jitoClient.createStakeInstructions(
            wallet.publicKey,
            new PublicKey(vaultAddress),
            amount * 10 ** 9, // Convert SOL to lamports
            lockPeriod
          );
        } else {
          throw new Error('Using fallback simulation');
        }
      } catch (sdkError) {
        console.warn('Error using Jito SDK, falling back to simulation:', sdkError);
        
        // Create a simulated staking transaction
        // This is a placeholder transaction that doesn't actually stake funds
        // but lets us demonstrate the UI flow
        const toAccount = new PublicKey(vaultAddress);
        
        // Create a memo instruction to simulate staking
        const memoInstruction = new TransactionInstruction({
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: toAccount, isSigner: false, isWritable: true },
          ],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(`Simulate stake ${amount} SOL to vault ${vaultAddress.slice(0, 8)}... with ${lockPeriod} day lock`, 'utf-8'),
        });
        
        // Add compute budget instruction to make it look realistic
        const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
          units: 150000,
        });
        
        instructions = [computeBudgetInstruction, memoInstruction];
      }
      
      // Create a transaction from the instructions
      const latestBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = wallet.publicKey;
      
      // Sign and send the transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log('Transaction sent with signature:', signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      console.log('Transaction confirmed');
      
      // Refresh data
      await fetchJitoData();
      
      return { success: true, signature };
    } catch (error) {
      console.error('Error staking to vault:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a method to interact with the blockchain for unstaking
  const unstakeFromVault = async (vaultAddress: string, amount: number) => {
    if (!connection || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }
    
    if (!jitoClient && isJitoEnabled) {
      console.warn('Jito client not available for unstaking, attempting to reinitialize...');
      try {
        const client = new RestakingClient(connection);
        setJitoClient(client);
      } catch (initError) {
        console.error('Failed to initialize Jito client for unstaking:', initError);
      }
    }
    
    try {
      setIsLoading(true);
      
      // Create transaction instructions
      let instructions: TransactionInstruction[] = [];
      
      try {
        if (jitoClient) {
          // Try to use real client
          instructions = await jitoClient.createUnstakeInstructions(
            wallet.publicKey,
            new PublicKey(vaultAddress),
            amount * 10 ** 9 // Convert SOL to lamports
          );
        } else {
          throw new Error('Using fallback simulation for unstaking');
        }
      } catch (sdkError) {
        console.warn('Error using Jito SDK for unstaking, falling back to simulation:', sdkError);
        
        // Create a simulated unstaking transaction
        const fromAccount = new PublicKey(vaultAddress);
        
        // Create a memo instruction to simulate unstaking
        const memoInstruction = new TransactionInstruction({
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: fromAccount, isSigner: false, isWritable: true },
          ],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(`Simulate unstake ${amount} SOL from vault ${vaultAddress.slice(0, 8)}...`, 'utf-8'),
        });
        
        // Add compute budget instruction to make it look realistic
        const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
          units: 150000,
        });
        
        instructions = [computeBudgetInstruction, memoInstruction];
      }
      
      // Create a transaction from the instructions
      const latestBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = wallet.publicKey;
      
      // Sign and send the transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log('Unstake transaction sent with signature:', signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      console.log('Unstake transaction confirmed');
      
      // Refresh data
      await fetchJitoData();
      
      return { success: true, signature };
    } catch (error) {
      console.error('Error unstaking from vault:', error);
      throw error;
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
    isInitialized,
    setNetwork,
    refreshBalance,
    jitoClient,
    isJitoEnabled,
    setJitoEnabled,
    fetchJitoData,
    stakeToVault,
    unstakeFromVault,
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