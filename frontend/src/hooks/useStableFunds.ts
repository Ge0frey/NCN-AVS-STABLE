import { useState, useEffect, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import StableFundsClient, { StablecoinParams, StablebondData } from '../services/anchor-client';

const FALLBACK_STABLECOINS_STORAGE_KEY = 'stable-funds-fallback-stablecoins';

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

const storeFallbackStablecoinsToStorage = (stablecoins: UserStablecoin[]): void => {
  try {
    localStorage.setItem(FALLBACK_STABLECOINS_STORAGE_KEY, JSON.stringify(stablecoins));
  } catch (error) {
    console.error('Error storing fallback stablecoins to localStorage:', error);
  }
};

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * 
 * @returns 
 */
function generateSolanaLikeSignature(): string {
  let signature = '';

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
  const [fallbackStablecoins, setFallbackStablecoins] = useState<UserStablecoin[]>(() => {
    return getFallbackStablecoinsFromStorage();
  });

  useEffect(() => {
    storeFallbackStablecoinsToStorage(fallbackStablecoins);
  }, [fallbackStablecoins]);

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
          });
      } catch (err) {
        console.error('Error initializing StableFundsClient:', err);
        setError('Failed to connect to the Solana blockchain. Please refresh and try again.');
        setClient(null);
      }
    } else {
      setClient(null);
    }
    
    return () => {
      // Any cleanup needed when the component unmounts
    };
  }, [wallet, connection]);

  useEffect(() => {
    const handleFallbackStablecoin = (event: FallbackStablecoinEvent) => {
      const { stablecoin } = event.detail;
      
      console.log('Received fallback stablecoin:', stablecoin);
      
      setFallbackStablecoins(prev => {
        const exists = prev.some(coin => coin.id === stablecoin.id);
        if (exists) {
          return prev;
        }
        const updatedStablecoins = [...prev, stablecoin];
        storeFallbackStablecoinsToStorage(updatedStablecoins);
        return updatedStablecoins;
      });
    };
    
    window.addEventListener('fallback-stablecoin-created', handleFallbackStablecoin as EventListener);
    
    return () => {
      window.removeEventListener('fallback-stablecoin-created', handleFallbackStablecoin as EventListener);
    };
  }, []);

  const fetchUserStablecoins = useCallback(async () => {
    const storedFallbacks = getFallbackStablecoinsFromStorage();
    if (storedFallbacks.length > 0 && JSON.stringify(storedFallbacks) !== JSON.stringify(fallbackStablecoins)) {
      setFallbackStablecoins(storedFallbacks);
    }

    if (!client) {
      setUserStablecoins([...storedFallbacks]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const stablecoins = await client.fetchUserStablecoins();
      
      
      const combinedStablecoins = [...stablecoins];
      
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
      
      setUserStablecoins([...storedFallbacks]);
    } finally {
      setLoading(false);
    }
  }, [client, fallbackStablecoins]);

  useEffect(() => {
    if (client) {
      fetchUserStablecoins();
    } else if (fallbackStablecoins.length > 0) {
      setUserStablecoins([...fallbackStablecoins]);
    }
  }, [client, fallbackStablecoins, fetchUserStablecoins]);

  const fetchStablebonds = useCallback(async (maxRetries = 3) => {
    if (!client) return;
    
    try {
      setLoading(true);
      setError(null);
      
      setStablebonds([]);
      
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

  const addFallbackStablecoin = useCallback((stablecoin: UserStablecoin) => {
    console.log('Adding fallback stablecoin manually:', stablecoin);
    setFallbackStablecoins(prev => {
      // Check if this stablecoin already exists to avoid duplicates
      const exists = prev.some(coin => coin.id === stablecoin.id);
      if (exists) {
        return prev;
      }
      const updatedStablecoins = [...prev, stablecoin];
      storeFallbackStablecoinsToStorage(updatedStablecoins);
      return updatedStablecoins;
    });
  }, []);

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
      
      if (typeof stablecoinConfig === 'string' && !stablecoinConfig.includes('11111')) {
        const fallbackId = stablecoinConfig;
        
        const stablecoin = fallbackStablecoins.find(coin => coin.id === fallbackId);
        
        if (!stablecoin) {
          throw new Error('Stablecoin not found');
        }
        
        const updatedStablecoin = {
          ...stablecoin,
        };
        
        setFallbackStablecoins(prev => 
          prev.map(coin => coin.id === fallbackId ? updatedStablecoin : coin)
        );
        
        const mockSignature = generateSolanaLikeSignature();
        
        sessionStorage.setItem(`tx-${mockSignature}`, 'mock');
        
        return { signature: mockSignature };
      }
      
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
      
      if (typeof stablecoinConfig === 'string' && !stablecoinConfig.includes('11111')) {
        const fallbackId = stablecoinConfig;
        
        const stablecoin = fallbackStablecoins.find(coin => coin.id === fallbackId);
        
        if (!stablecoin) {
          throw new Error('Stablecoin not found');
        }
        
        const updatedStablecoin = {
          ...stablecoin,
          totalSupply: stablecoin.totalSupply + amount,
          marketCap: stablecoin.marketCap + amount,
          balance: stablecoin.balance + amount,
        };
        
        setFallbackStablecoins(prev => 
          prev.map(coin => coin.id === fallbackId ? updatedStablecoin : coin)
        );
        
        const mockSignature = generateSolanaLikeSignature();
        
        sessionStorage.setItem(`tx-${mockSignature}`, 'mock');
        
        return { signature: mockSignature };
      }
      
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

  const getStablecoin = useCallback((idOrName: string, symbol?: string): UserStablecoin | undefined => {
    if (symbol) {
      return userStablecoins.find(coin => 
        coin.name.toLowerCase() === idOrName.toLowerCase() && 
        coin.symbol.toLowerCase() === symbol.toLowerCase()
      );
    }
    
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