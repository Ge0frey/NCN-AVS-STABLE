import { useState, useEffect, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import StableFundsClient, { StablecoinParams, StablebondData } from '../services/anchor-client';

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

export function useStableFunds() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [client, setClient] = useState<StableFundsClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stablebonds, setStablebonds] = useState<StablebondData[]>([]);
  const [userStablecoins, setUserStablecoins] = useState<UserStablecoin[]>([]);

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

  // Fetch user's stablecoins
  const fetchUserStablecoins = useCallback(async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const stablecoins = await client.fetchUserStablecoins();
      setUserStablecoins(stablecoins);
    } catch (err) {
      console.error('Error fetching user stablecoins:', err);
      setError('Failed to fetch stablecoins. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Auto-fetch user stablecoins when client changes
  useEffect(() => {
    if (client) {
      fetchUserStablecoins();
    }
  }, [client, fetchUserStablecoins]);

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

  // Deposit collateral for an existing stablecoin
  const depositCollateral = useCallback(async (
    stablecoinConfig: PublicKey,
    amount: number,
    collateralType: 'Stablebond' | 'SOL' | 'USDC',
    stablebondMint?: PublicKey
  ) => {
    if (!client) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await client.depositCollateral(
        stablecoinConfig,
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
  }, [client]);

  // Mint additional stablecoin tokens
  const mintStablecoin = useCallback(async (
    stablecoinConfig: PublicKey,
    amount: number
  ) => {
    if (!client) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await client.mintStablecoin(stablecoinConfig, amount);
      return result;
    } catch (err) {
      console.error('Error minting stablecoin:', err);
      setError('Failed to mint stablecoin. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

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
  };
} 