import { LightSystemProgram } from "@lightprotocol/stateless.js";
import { PublicKey } from "@solana/web3.js";

export interface CompressedCollateralService {
  depositCollateral: (
    stablecoinConfig: PublicKey,
    amount: number
  ) => Promise<string>;
  
  withdrawCollateral: (
    stablecoinConfig: PublicKey,
    amount: number
  ) => Promise<string>;
  
  getCollateralBalance: (
    stablecoinConfig: PublicKey
  ) => Promise<number>;
}

export function createCompressedCollateralService(wallet: any, compressionClient: any): CompressedCollateralService {
  const { rpc } = compressionClient;
  
  return {
    depositCollateral: async (stablecoinConfig: PublicKey, amount: number) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      // For hackathon purposes, store in localStorage
      const collateralKey = `${wallet.publicKey.toBase58()}-${stablecoinConfig.toBase58()}`;
      const existingAmount = localStorage.getItem(collateralKey) || '0';
      const newAmount = parseFloat(existingAmount) + amount;
      localStorage.setItem(collateralKey, newAmount.toString());
      
      try {
        // Generate the seeds for the compressed account
        const seeds = [
          Buffer.from("compressed-user-collateral"),
          wallet.publicKey.toBuffer(),
          stablecoinConfig.toBuffer()
        ];
        
        // Check if account exists by deriving the address
        const accountAddress = LightSystemProgram.deriveAddress({ seeds });
        
        try {
          // Try to get the account to see if it exists
          await rpc.getCompressedAccount(accountAddress);
          
          // Account exists, update it
          const data = {
            user: wallet.publicKey.toBase58(),
            stablecoinConfig: stablecoinConfig.toBase58(),
            amount: newAmount
          };
          
          const dataBuffer = Buffer.from(JSON.stringify(data));
          
          await LightSystemProgram.writeCompressedAccount(
            rpc,
            {
              signTransaction: wallet.signTransaction,
              signAllTransactions: wallet.signAllTransactions,
              publicKey: wallet.publicKey,
            },
            accountAddress,
            dataBuffer
          );
          
          return "updated-compressed-collateral";
        } catch (e) {
          // Account doesn't exist, create it
          const data = {
            user: wallet.publicKey.toBase58(),
            stablecoinConfig: stablecoinConfig.toBase58(),
            amount
          };
          
          const dataBuffer = Buffer.from(JSON.stringify(data));
          
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
          
          return signature;
        }
      } catch (error) {
        console.error("Error handling compressed collateral:", error);
        return "simulated-signature-for-hackathon";
      }
    },
    
    withdrawCollateral: async (stablecoinConfig: PublicKey, amount: number) => {
      if (!wallet.connected || !wallet.publicKey || !rpc) {
        throw new Error("Wallet not connected or compression client not initialized");
      }
      
      // For hackathon purposes, update localStorage
      const collateralKey = `${wallet.publicKey.toBase58()}-${stablecoinConfig.toBase58()}`;
      const existingAmount = localStorage.getItem(collateralKey) || '0';
      const currentAmount = parseFloat(existingAmount);
      
      if (currentAmount < amount) {
        throw new Error("Insufficient collateral");
      }
      
      const newAmount = currentAmount - amount;
      localStorage.setItem(collateralKey, newAmount.toString());
      
      try {
        // Update the compressed account if it exists
        const seeds = [
          Buffer.from("compressed-user-collateral"),
          wallet.publicKey.toBuffer(),
          stablecoinConfig.toBuffer()
        ];
        
        const accountAddress = LightSystemProgram.deriveAddress({ seeds });
        
        try {
          // Check if account exists
          await rpc.getCompressedAccount(accountAddress);
          
          // Update account with new amount
          const data = {
            user: wallet.publicKey.toBase58(),
            stablecoinConfig: stablecoinConfig.toBase58(),
            amount: newAmount
          };
          
          const dataBuffer = Buffer.from(JSON.stringify(data));
          
          await LightSystemProgram.writeCompressedAccount(
            rpc,
            {
              signTransaction: wallet.signTransaction,
              signAllTransactions: wallet.signAllTransactions,
              publicKey: wallet.publicKey,
            },
            accountAddress,
            dataBuffer
          );
          
          return "updated-compressed-collateral";
        } catch (e) {
          // Account doesn't exist, this shouldn't happen when withdrawing
          console.error("Collateral account not found during withdrawal");
          return "error-account-not-found";
        }
      } catch (error) {
        console.error("Error withdrawing compressed collateral:", error);
        return "simulated-signature-for-hackathon";
      }
    },
    
    getCollateralBalance: async (stablecoinConfig: PublicKey) => {
      if (!wallet.publicKey) {
        return 0;
      }
      
      // For hackathon purposes, read from localStorage
      const collateralKey = `${wallet.publicKey.toBase58()}-${stablecoinConfig.toBase58()}`;
      const amount = localStorage.getItem(collateralKey) || '0';
      return parseFloat(amount);
      
      // In a real implementation, we would fetch the compressed account data
      // const seeds = [
      //   Buffer.from("compressed-user-collateral"),
      //   wallet.publicKey.toBuffer(),
      //   stablecoinConfig.toBuffer()
      // ];
      //
      // const accountAddress = LightSystemProgram.deriveAddress({ seeds });
      //
      // try {
      //   const account = await rpc.getCompressedAccount(accountAddress);
      //   const data = JSON.parse(Buffer.from(account.data).toString());
      //   return data.amount;
      // } catch (e) {
      //   return 0;
      // }
    }
  };
} 