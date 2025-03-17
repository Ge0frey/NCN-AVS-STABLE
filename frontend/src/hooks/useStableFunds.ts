import { useState, useEffect, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import StableFundsClient, { StablecoinParams, StablebondData } from '../services/anchor-client';

// Key for storing fallback stablecoins in localStorage
const FALLBACK_STABLECOINS_STORAGE_KEY = 'stable-funds-fallback-stablecoins';

// Create an interface for the fallback stablecoin event data
interface FallbackStablecoinEvent extends Event {
  detail: {
    stablecoin: UserStablecoin;
  };
}

export interface UserStablecoin {
  id: string;
  name: string;
  symbol: string;
  description: string;
  icon: string;
  totalSupply: number;
  marketCap: number;
  collateralRatio: number;
  collateralType: string;
  price: number;
  balance: number;
  isOwned: boolean;
  createdAt: number;
}

// Helper to safely retrieve fallback stablecoins from localStorage
const getFallbackStablecoinsFromStorage = (): UserStablecoin[] => {
  try {
    const storedData = localStorage.getItem(FALLBACK_STABLECOINS_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error retrieving fallback stablecoins from localStorage:', error);
  }
  return [];
};

// Helper to safely store fallback stablecoins to localStorage
const storeFallbackStablecoinsToStorage = (stablecoins: UserStablecoin[]): void => {
  try {
    localStorage.setItem(FALLBACK_STABLECOINS_STORAGE_KEY, JSON.stringify(stablecoins));
  } catch (error) {
    console.error('Error storing fallback stablecoins to localStorage:', error);
  }
};

// Base58 alphabet used by Solana for transaction signatures
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Generates a random Solana-like transaction signature
 * @returns A random string that looks like a Solana transaction signature (88 chars)
 */
function generateSolanaLikeSignature(): string {
  let signature = '';
  // Generate 88 random characters from the base58 alphabet
  for (let i = 0; i < 88; i++) {
    const randomIndex = Math.floor(Math.random() * BASE58_ALPHABET.length);
    signature += BASE58_ALPHABET[randomIndex];
  }
  return signature;
}

export function useStableFunds() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [client, setClient] = useState<StableFundsClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stablebonds, setStablebonds] = useState<StablebondData[]>([]);
  const [userStablecoins, setUserStablecoins] = useState<UserStablecoin[]>([]);
  // Initialize fallback stablecoins from localStorage
  const [fallbackStablecoins, setFallbackStablecoins] = useState<UserStablecoin[]>(() => {
    return getFallbackStablecoinsFromStorage();
  });

  // Update localStorage whenever fallbackStablecoins changes
  useEffect(() => {
    storeFallbackStablecoinsToStorage(fallbackStablecoins);
  }, [fallbackStablecoins]);

  // Initialize the client when wallet is connected
  useEffect(() => {
    if (wallet && connection) {
      try {
        const provider = new AnchorProvider(
          connection,
          wallet,
          AnchorProvider.defaultOptions()
        );
        
        const stableFundsClient = new StableFundsClient(provider);
        setClient(stableFundsClient);
        setError(null);
        
        // Check bridge server connection
        fetch('http://localhost:3002/health')
          .then(response => {
            if (!response.ok) {
              throw new Error('Bridge server is not responding properly');
            }
            return response.json();
          })
          .then(data => {
            console.log('Bridge server health check:', data);
          })
          .catch(err => {
            console.warn('Bridge server health check failed:', err);
            // Don't set error here, as the bridge server is optional
          });
      } catch (err) {
        console.error('Error initializing StableFundsClient:', err);
        setError('Failed to connect to the Solana blockchain. Please refresh and try again.');
        setClient(null);
      }
    } else {
      setClient(null);
    }
    
    // Cleanup function
    return () => {
      // Any cleanup needed when the component unmounts
    };
  }, [wallet, connection]);

  // Handler for fallback stablecoin creation events
  useEffect(() => {
    // Function to handle the fallback stablecoin event
    const handleFallbackStablecoin = (event: FallbackStablecoinEvent) => {
      const { stablecoin } = event.detail;
      
      console.log('Received fallback stablecoin:', stablecoin);
      
      // Add the fallback stablecoin to our state
      setFallbackStablecoins(prev => {
        // Check if this stablecoin already exists to avoid duplicates
        const exists = prev.some(coin => coin.id === stablecoin.id);
        if (exists) {
          return prev;
        }
        const updatedStablecoins = [...prev, stablecoin];
        // Also update localStorage immediately to ensure persistence
        storeFallbackStablecoinsToStorage(updatedStablecoins);
        return updatedStablecoins;
      });
    };
    
    // Add event listener for fallback stablecoin events
    window.addEventListener('fallback-stablecoin-created', handleFallbackStablecoin as EventListener);
    
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('fallback-stablecoin-created', handleFallbackStablecoin as EventListener);
    };
  }, []);

  // Fetch user's stablecoins
  const fetchUserStablecoins = useCallback(async () => {
    // Always load from localStorage first to ensure we have the latest fallbacks
    const storedFallbacks = getFallbackStablecoinsFromStorage();
    if (storedFallbacks.length > 0 && JSON.stringify(storedFallbacks) !== JSON.stringify(fallbackStablecoins)) {
      setFallbackStablecoins(storedFallbacks);
    }

    if (!client) {
      // Even if there's no client, we should still display any fallback stablecoins
      setUserStablecoins([...storedFallbacks]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stablecoins from the blockchain
      const stablecoins = await client.fetchUserStablecoins();
      
      // Combine blockchain stablecoins with fallback stablecoins
      // Make sure we don't have duplicates (check by name and symbol)
      const combinedStablecoins = [...stablecoins];
      
      // Add fallback stablecoins that don't exist in the blockchain list
      storedFallbacks.forEach(fallbackCoin => {
        const existsInBlockchain = stablecoins.some(
          coin => coin.name === fallbackCoin.name && coin.symbol === fallbackCoin.symbol
        );
        
        if (!existsInBlockchain) {
          combinedStablecoins.push(fallbackCoin);
        }
      });
      
      setUserStablecoins(combinedStablecoins);
    } catch (err) {
      console.error('Error fetching user stablecoins:', err);
      setError('Failed to fetch stablecoins. Please try again.');
      
      // Even if there's an error, still display any fallback stablecoins
      setUserStablecoins([...storedFallbacks]);
    } finally {
      setLoading(false);
    }
  }, [client, fallbackStablecoins]);

  // Auto-fetch user stablecoins when client changes or fallbackStablecoins changes
  useEffect(() => {
    if (client) {
      fetchUserStablecoins();
    } else if (fallbackStablecoins.length > 0) {
      // If no client but we have fallback stablecoins, still update userStablecoins
      setUserStablecoins([...fallbackStablecoins]);
    }
  }, [client, fallbackStablecoins, fetchUserStablecoins]);

  // Fetch available stablebonds
  const fetchStablebonds = useCallback(async (maxRetries = 3) => {
    if (!client) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Show a more informative message during the fetching process
      setStablebonds([]);
      
      // Fetch bonds using the client implementation with retry mechanism
      const bonds = await client.fetchStablebonds(maxRetries);
      
      if (bonds.length > 0) {
        console.log(`Successfully fetched ${bonds.length} stablebonds`);
        setStablebonds(bonds);
        setError(null);
      } else {
        console.warn('No stablebonds were returned');
        setError('No stablebonds are currently available. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching stablebonds:', err);
      setError('Failed to fetch stablebonds. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Create a new stablecoin
  const createStablecoin = useCallback(async (params: StablecoinParams) => {
    if (!client) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await client.createStablecoin(params);
      
      // After creating a stablecoin, refresh the user's stablecoins list
      await fetchUserStablecoins();
      
      return result;
    } catch (err) {
      console.error('Error creating stablecoin:', err);
      setError('Failed to create stablecoin. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fetchUserStablecoins]);

  // Add a function to manually add a fallback stablecoin (for direct integration)
  const addFallbackStablecoin = useCallback((stablecoin: UserStablecoin) => {
    console.log('Adding fallback stablecoin manually:', stablecoin);
    setFallbackStablecoins(prev => {
      // Check if this stablecoin already exists to avoid duplicates
      const exists = prev.some(coin => coin.id === stablecoin.id);
      if (exists) {
        return prev;
      }
      const updatedStablecoins = [...prev, stablecoin];
      // Also update localStorage immediately
      storeFallbackStablecoinsToStorage(updatedStablecoins);
      return updatedStablecoins;
    });
  }, []);

  // Deposit collateral for an existing stablecoin
  const depositCollateral = useCallback(async (
    stablecoinConfig: PublicKey | string,
    amount: number,
    collateralType: 'Stablebond' | 'SOL' | 'USDC',
    stablebondMint?: PublicKey
  ) => {
    if (!client && typeof stablecoinConfig !== 'string') {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're dealing with a fallback stablecoin (identified by string ID)
      if (typeof stablecoinConfig === 'string' && !stablecoinConfig.includes('11111')) {
        // This is a fallback stablecoin, handle it differently
        const fallbackId = stablecoinConfig;
        
        // Find the stablecoin in our fallback list
        const stablecoin = fallbackStablecoins.find(coin => coin.id === fallbackId);
        
        if (!stablecoin) {
          throw new Error('Stablecoin not found');
        }
        
        // Create a simulated updated stablecoin with the new collateral
        const updatedStablecoin = {
          ...stablecoin,
          // You could update other properties here to reflect the deposit
          // For example, you might want to increase the collateral ratio
        };
        
        // Update the fallback stablecoin in state
        setFallbackStablecoins(prev => 
          prev.map(coin => coin.id === fallbackId ? updatedStablecoin : coin)
        );
        
        // Generate a mock transaction signature using our utility function
        const mockSignature = generateSolanaLikeSignature();
        
        // Store a flag in sessionStorage to identify this as a mock transaction
        sessionStorage.setItem(`tx-${mockSignature}`, 'mock');
        
        // Return a simulated result
        return { signature: mockSignature };
      }
      
      // If we get here, this is a real stablecoin, use the client
      const configKey = typeof stablecoinConfig === 'string' 
        ? new PublicKey(stablecoinConfig) 
        : stablecoinConfig;
      
      const result = await client!.depositCollateral(
        configKey,
        amount,
        collateralType,
        stablebondMint
      );
      return result;
    } catch (err) {
      console.error('Error depositing collateral:', err);
      setError('Failed to deposit collateral. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fallbackStablecoins]);

  // Mint additional stablecoin tokens
  const mintStablecoin = useCallback(async (
    stablecoinConfig: PublicKey | string,
    amount: number
  ) => {
    if (!client && typeof stablecoinConfig !== 'string') {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're dealing with a fallback stablecoin (identified by string ID)
      if (typeof stablecoinConfig === 'string' && !stablecoinConfig.includes('11111')) {
        // This is a fallback stablecoin, handle it differently
        const fallbackId = stablecoinConfig;
        
        // Find the stablecoin in our fallback list
        const stablecoin = fallbackStablecoins.find(coin => coin.id === fallbackId);
        
        if (!stablecoin) {
          throw new Error('Stablecoin not found');
        }
        
        // Create a simulated updated stablecoin with the new amount
        const updatedStablecoin = {
          ...stablecoin,
          totalSupply: stablecoin.totalSupply + amount,
          marketCap: stablecoin.marketCap + amount,
          balance: stablecoin.balance + amount,
        };
        
        // Update the fallback stablecoin in state
        setFallbackStablecoins(prev => 
          prev.map(coin => coin.id === fallbackId ? updatedStablecoin : coin)
        );
        
        // Generate a mock transaction signature using our utility function
        const mockSignature = generateSolanaLikeSignature();
        
        // Store a flag in sessionStorage to identify this as a mock transaction
        sessionStorage.setItem(`tx-${mockSignature}`, 'mock');
        
        // Return a simulated result
        return { signature: mockSignature };
      }
      
      // If we get here, this is a real stablecoin, use the client
      const configKey = typeof stablecoinConfig === 'string' 
        ? new PublicKey(stablecoinConfig) 
        : stablecoinConfig;
      
      const result = await client!.mintStablecoin(configKey, amount);
      return result;
    } catch (err) {
      console.error('Error minting stablecoin:', err);
      setError('Failed to mint stablecoin. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fallbackStablecoins]);

  // Get a stablecoin by ID or by name and symbol
  const getStablecoin = useCallback((idOrName: string, symbol?: string): UserStablecoin | undefined => {
    // If symbol is provided, we're looking up by name and symbol
    if (symbol) {
      return userStablecoins.find(coin => 
        coin.name.toLowerCase() === idOrName.toLowerCase() && 
        coin.symbol.toLowerCase() === symbol.toLowerCase()
      );
    }
    
    // Otherwise, look up by ID
    return userStablecoins.find(coin => coin.id === idOrName);
  }, [userStablecoins]);

  return {
    client,
    loading,
    error,
    stablebonds,
    userStablecoins,
    fetchStablebonds,
    fetchUserStablecoins,
    createStablecoin,
    depositCollateral,
    mintStablecoin,
    addFallbackStablecoin,
    getStablecoin
  };
} 