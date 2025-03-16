import { useState, useEffect, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import StableFundsClient, { StablecoinParams, StablebondData } from '../services/anchor-client';

export function useStableFunds() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [client, setClient] = useState<StableFundsClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stablebonds, setStablebonds] = useState<StablebondData[]>([]);

  // Initialize the client when wallet is connected
  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );
      
      const stableFundsClient = new StableFundsClient(provider);
      setClient(stableFundsClient);
    } else {
      setClient(null);
    }
  }, [wallet, connection]);

  // Fetch available stablebonds
  const fetchStablebonds = useCallback(async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a production environment, we would use the real Etherfuse SDK
      // const bonds = await client.fetchRealStablebonds(connection.rpcEndpoint);
      
      // For now, use our mock implementation
      const bonds = await client.fetchStablebonds();
      setStablebonds(bonds);
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
      return result;
    } catch (err) {
      console.error('Error creating stablecoin:', err);
      setError('Failed to create stablecoin. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

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
    fetchStablebonds,
    createStablecoin,
    depositCollateral,
    mintStablecoin,
  };
} 