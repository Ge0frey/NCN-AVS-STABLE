import { createRpc, Rpc, LightSystemProgram } from "@lightprotocol/stateless.js";
import { createMint, mintTo, transfer } from "@lightprotocol/compressed-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export interface CompressionClient {
  rpc: Rpc | null;
  createCompressedStablecoin: (
    name: string,
    symbol: string,
    description: string,
    iconIndex: number,
    collateralType: number,
    collateralizationRatio: number
  ) => Promise<{ mint: PublicKey, signature: string }>;
  mintCompressedStablecoin: (
    mint: PublicKey,
    amount: number
  ) => Promise<string>;
  transferCompressedStablecoin: (
    mint: PublicKey,
    amount: number,
    to: PublicKey
  ) => Promise<string>;
}

export function createCompressionClient(connection: Connection, wallet: any): CompressionClient {
  const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || connection.rpcEndpoint;
  const COMPRESSION_ENDPOINT = process.env.COMPRESSION_RPC_URL || RPC_ENDPOINT;
  const PROVER_ENDPOINT = process.env.PROVER_RPC_URL || RPC_ENDPOINT;
  
  // Initialize RPC if possible, otherwise return a client with null RPC
  let rpc: Rpc | null = null;
  try {
    rpc = createRpc(RPC_ENDPOINT, COMPRESSION_ENDPOINT, PROVER_ENDPOINT);
  } catch (error) {
    console.error("Error creating compression RPC:", error);
  }
  
  return {
    rpc,
    
    createCompressedStablecoin: async (
      name: string,
      symbol: string,
      description: string,
      iconIndex: number,
      collateralType: number,
      collateralizationRatio: number
    ) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      // Create compressed token mint
      const { mint, transactionSignature } = await createMint(
        rpc,
        {
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          publicKey: wallet.publicKey,
        },
        wallet.publicKey,
        6 // 6 decimals for stablecoin
      );
      
      // For the hackathon, we can store this data in localStorage temporarily
      const stablecoinData = {
        mint: mint.toBase58(),
        name,
        symbol,
        description,
        iconIndex,
        collateralType,
        collateralizationRatio,
        isCompressed: true,
        createdAt: Date.now()
      };
      
      const existingData = localStorage.getItem('compressed-stablecoins') || '[]';
      const allStablecoins = JSON.parse(existingData);
      allStablecoins.push(stablecoinData);
      localStorage.setItem('compressed-stablecoins', JSON.stringify(allStablecoins));
      
      return { mint, signature: transactionSignature };
    },
    
    mintCompressedStablecoin: async (mint: PublicKey, amount: number) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      const signature = await mintTo(
        rpc,
        {
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          publicKey: wallet.publicKey,
        },
        mint,
        wallet.publicKey,
        {
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          publicKey: wallet.publicKey,
        },
        amount
      );
      
      return signature;
    },
    
    transferCompressedStablecoin: async (mint: PublicKey, amount: number, to: PublicKey) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      const signature = await transfer(
        rpc,
        {
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          publicKey: wallet.publicKey,
        },
        mint,
        amount,
        {
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
          publicKey: wallet.publicKey,
        },
        to
      );
      
      return signature;
    }
  };
} 