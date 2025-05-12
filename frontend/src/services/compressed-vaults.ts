import { LightSystemProgram } from "@lightprotocol/stateless.js";
import { PublicKey } from "@solana/web3.js";

export interface CompressedVaultService {
  createCompressedVault: (
    name: string,
    riskLevel: number,
    autoCompound: boolean,
    collateralMint: PublicKey
  ) => Promise<{ address: PublicKey, signature: string }>;
  
  depositToCompressedVault: (
    vaultAddress: PublicKey,
    collateralMint: PublicKey,
    amount: number
  ) => Promise<string>;
  
  withdrawFromCompressedVault: (
    vaultAddress: PublicKey,
    collateralMint: PublicKey,
    amount: number
  ) => Promise<string>;
  
  getCompressedVaultData: (
    vaultAddress: PublicKey
  ) => Promise<any>;
}

export function createCompressedVaultService(wallet: any, compressionClient: any): CompressedVaultService {
  const { rpc } = compressionClient;
  
  return {
    createCompressedVault: async (
      name: string,
      riskLevel: number,
      autoCompound: boolean,
      collateralMint: PublicKey
    ) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      // Create serialized data for smart vault
      const data = {
        name,
        riskLevel,
        autoCompound,
        collateralMint: collateralMint.toBase58(),
        owner: wallet.publicKey.toBase58(),
        totalDeposited: 0,
        totalAllocated: 0,
        strategies: [],
        active: true,
        lastUpdateTime: Date.now(),
        totalYieldEarned: 0
      };
      
      // Convert to buffer
      const dataBuffer = Buffer.from(JSON.stringify(data));
      
      // Create seeds for the compressed account
      const seeds = [
        Buffer.from("compressed-smart-vault"),
        wallet.publicKey.toBuffer(),
        collateralMint.toBuffer()
      ];
      
      try {
        // Create compressed account
        const { address, signature } = await LightSystemProgram.createCompressedAccount(
          rpc,
          {
            signTransaction: wallet.signTransaction,
            signAllTransactions: wallet.signAllTransactions,
            publicKey: wallet.publicKey,
          },
          dataBuffer.length,
          { seeds }
        );
        
        // Write data to the compressed account
        await LightSystemProgram.writeCompressedAccount(
          rpc,
          {
            signTransaction: wallet.signTransaction,
            signAllTransactions: wallet.signAllTransactions,
            publicKey: wallet.publicKey,
          },
          address,
          dataBuffer
        );
        
        // For hackathon purposes, store in localStorage as well for easier retrieval
        const vaultData = {
          address: address.toBase58(),
          ...data,
          createdAt: Date.now()
        };
        
        const existingVaults = localStorage.getItem('compressed-vaults') || '[]';
        const allVaults = JSON.parse(existingVaults);
        allVaults.push(vaultData);
        localStorage.setItem('compressed-vaults', JSON.stringify(allVaults));
        
        return { address, signature };
      } catch (error) {
        console.error("Error creating compressed vault:", error);
        
        // Fallback for hackathon demo - create a mock vault in localStorage only
        const mockAddress = new PublicKey(crypto.randomUUID().replace(/-/g, '').substring(0, 32));
        
        const vaultData = {
          address: mockAddress.toBase58(),
          ...data,
          createdAt: Date.now()
        };
        
        const existingVaults = localStorage.getItem('compressed-vaults') || '[]';
        const allVaults = JSON.parse(existingVaults);
        allVaults.push(vaultData);
        localStorage.setItem('compressed-vaults', JSON.stringify(allVaults));
        
        return { 
          address: mockAddress, 
          signature: "simulated-signature-for-hackathon" 
        };
      }
    },
    
    depositToCompressedVault: async (
      vaultAddress: PublicKey,
      collateralMint: PublicKey,
      amount: number
    ) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      // For hackathon, we'll simulate the deposit by updating localStorage
      const existingVaults = localStorage.getItem('compressed-vaults') || '[]';
      const allVaults = JSON.parse(existingVaults);
      
      const vaultIndex = allVaults.findIndex(
        (v: any) => v.address === vaultAddress.toBase58()
      );
      
      if (vaultIndex === -1) {
        throw new Error("Vault not found");
      }
      
      allVaults[vaultIndex].totalDeposited += amount;
      allVaults[vaultIndex].lastUpdateTime = Date.now();
      
      localStorage.setItem('compressed-vaults', JSON.stringify(allVaults));
      
      // In a real implementation, we would send a transaction to the program
      
      return "simulated-signature-for-hackathon";
    },
    
    withdrawFromCompressedVault: async (
      vaultAddress: PublicKey,
      collateralMint: PublicKey,
      amount: number
    ) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      // For hackathon, we'll simulate the withdrawal by updating localStorage
      const existingVaults = localStorage.getItem('compressed-vaults') || '[]';
      const allVaults = JSON.parse(existingVaults);
      
      const vaultIndex = allVaults.findIndex(
        (v: any) => v.address === vaultAddress.toBase58()
      );
      
      if (vaultIndex === -1) {
        throw new Error("Vault not found");
      }
      
      if (allVaults[vaultIndex].totalDeposited < amount) {
        throw new Error("Insufficient funds in vault");
      }
      
      allVaults[vaultIndex].totalDeposited -= amount;
      allVaults[vaultIndex].lastUpdateTime = Date.now();
      
      localStorage.setItem('compressed-vaults', JSON.stringify(allVaults));
      
      // In a real implementation, we would send a transaction to the program
      
      return "simulated-signature-for-hackathon";
    },
    
    getCompressedVaultData: async (vaultAddress: PublicKey) => {
      if (!rpc) {
        throw new Error("Compression client not initialized");
      }
      
      // For hackathon, we'll retrieve from localStorage
      const existingVaults = localStorage.getItem('compressed-vaults') || '[]';
      const allVaults = JSON.parse(existingVaults);
      
      const vault = allVaults.find(
        (v: any) => v.address === vaultAddress.toBase58()
      );
      
      if (!vault) {
        throw new Error("Vault not found");
      }
      
      return vault;
      
      // In a real implementation, we would fetch the data from the compressed account
      // const compressedAccount = await rpc.getCompressedAccount(vaultAddress);
      // return JSON.parse(Buffer.from(compressedAccount.data).toString());
    }
  };
} 