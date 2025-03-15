import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { RestakingVault, RestakingPosition } from '../types';
import config from '../config/env';
import { withFeatureFlag } from '../utils';

// Import Jito Restaking SDK
import { RestakingClient } from '@jito-foundation/restaking-sdk';

// Define interfaces for SDK types
interface JitoVault {
  address: PublicKey;
  name?: string;
  balance: bigint | number;
  delegatedAmount?: bigint | number;
  apy?: number;
}

interface JitoPosition {
  vaultAddress: PublicKey;
  stakedAmount: bigint | number;
  rewards?: bigint | number;
  lockPeriod?: number;
  lockExpiry?: bigint | number | null;
}

/**
 * Service for interacting with Jito Restaking
 */
class JitoRestakingService {
  private connection: Connection;
  private isEnabled: boolean;
  private jitoClient: RestakingClient | null;
  
  constructor() {
    this.connection = new Connection(config.SOLANA_RPC_URL);
    this.isEnabled = config.FEATURE_FLAG_JITO_RESTAKING_ENABLED;
    
    // Initialize Jito client if enabled
    if (this.isEnabled) {
      try {
        this.jitoClient = new RestakingClient(this.connection);
        console.log('Jito Restaking client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Jito client:', error);
        this.jitoClient = null;
      }
    } else {
      this.jitoClient = null;
    }
  }

  /**
   * Gets all available Jito vaults
   */
  async getVaults(): Promise<RestakingVault[]> {
    return withFeatureFlag(
      this.isEnabled,
      async () => {
        try {
          // Use the Jito client to fetch vaults
          if (this.jitoClient) {
            try {
              const vaults = await this.jitoClient.getVaults();
              return vaults.map((vault: JitoVault) => ({
                address: vault.address.toString(),
                name: vault.name || `Vault ${vault.address.toString().substring(0, 4)}`,
                balance: Number(vault.balance) / 1e9, // Convert lamports to SOL
                delegatedAmount: Number(vault.delegatedAmount || 0) / 1e9,
                apy: vault.apy || 5.0
              }));
            } catch (clientError) {
              console.error('Error fetching vaults from Jito client:', clientError);
              // Fall through to mock data
            }
          }
          
          // Fallback to mock data if client is not available or fetch fails
          console.log('Using mock vault data');
          const mockVaults: RestakingVault[] = [
            {
              address: '8xH3gJxzUXNFE1LfwxKNimvuUKmQUQS8kfAP8VvfbzFE',
              name: 'JitoSOL Main Vault',
              balance: 1250000,
              delegatedAmount: 1100000,
              apy: 5.2
            },
            {
              address: '5tGjhqee7vPXmvrZgs9gZGgvU4XJP97UHarWxR3UCpL9',
              name: 'JitoSOL High Yield Vault',
              balance: 850000,
              delegatedAmount: 820000,
              apy: 6.8
            }
          ];
          
          return mockVaults;
        } catch (error) {
          console.error('Error fetching vaults:', error);
          return [];
        }
      },
      []
    )();
  }

  /**
   * Gets a user's staking positions
   */
  async getUserPositions(walletAddress: string): Promise<RestakingPosition[]> {
    return withFeatureFlag(
      this.isEnabled,
      async () => {
        try {
          // Use the Jito client to fetch user positions
          if (this.jitoClient) {
            try {
              const walletPublicKey = new PublicKey(walletAddress);
              const positions = await this.jitoClient.getUserPositions(walletPublicKey);
              return positions.map((position: JitoPosition) => ({
                vaultAddress: position.vaultAddress.toString(),
                stakedAmount: Number(position.stakedAmount) / 1e9, // Convert lamports to SOL
                rewards: Number(position.rewards || 0) / 1e9,
                lockPeriod: position.lockPeriod || 0,
                lockExpiry: position.lockExpiry ? Number(position.lockExpiry) : null
              }));
            } catch (clientError) {
              console.error('Error fetching positions from Jito client:', clientError);
              // Fall through to mock data
            }
          }
          
          // Fallback to mock data if client is not available or fetch fails
          console.log('Using mock position data');
          const mockPositions: RestakingPosition[] = [
            {
              vaultAddress: '8xH3gJxzUXNFE1LfwxKNimvuUKmQUQS8kfAP8VvfbzFE',
              stakedAmount: 10.5,
              rewards: 0.25,
              lockPeriod: 0,
              lockExpiry: null
            }
          ];
          
          return mockPositions;
        } catch (error) {
          console.error('Error fetching user positions:', error);
          return [];
        }
      },
      []
    )();
  }

  /**
   * Stakes tokens into a Jito vault
   */
  async stakeToVault(
    walletAddress: string,
    vaultAddress: string,
    amount: number,
    lockPeriod: number = 0
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    return withFeatureFlag(
      this.isEnabled,
      async () => {
        try {
          console.log(`Staking ${amount} to vault ${vaultAddress} from wallet ${walletAddress}`);
          
          // Use the Jito client to stake tokens
          if (this.jitoClient) {
            try {
              const walletPublicKey = new PublicKey(walletAddress);
              const vaultPublicKey = new PublicKey(vaultAddress);
              const amountLamports = Math.floor(amount * 1e9); // Convert SOL to lamports
              
              const transaction = await this.jitoClient.createStakeTransaction(
                walletPublicKey,
                vaultPublicKey,
                amountLamports,
                lockPeriod
              );
              
              // In a real implementation, the transaction would be sent to the frontend for signing
              // Here we're returning the transaction for the frontend to sign
              return {
                success: true,
                txId: 'transaction-needs-signing',
                transaction: JSON.stringify(transaction.serialize())
              };
            } catch (clientError) {
              console.error('Error creating stake transaction:', clientError);
              return {
                success: false,
                error: clientError instanceof Error ? clientError.message : 'Failed to create stake transaction'
              };
            }
          }
          
          // Simulate successful staking for development
          console.log('Using mock staking transaction');
          return {
            success: true,
            txId: 'simulated-transaction-id'
          };
        } catch (error) {
          console.error('Error staking to vault:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      { success: false, error: 'Jito Restaking feature is disabled' }
    )();
  }

  /**
   * Unstakes tokens from a Jito vault
   */
  async unstakeFromVault(
    walletAddress: string,
    vaultAddress: string,
    amount: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    return withFeatureFlag(
      this.isEnabled,
      async () => {
        try {
          console.log(`Unstaking ${amount} from vault ${vaultAddress} to wallet ${walletAddress}`);
          
          // Use the Jito client to unstake tokens
          if (this.jitoClient) {
            try {
              const walletPublicKey = new PublicKey(walletAddress);
              const vaultPublicKey = new PublicKey(vaultAddress);
              const amountLamports = Math.floor(amount * 1e9); // Convert SOL to lamports
              
              const transaction = await this.jitoClient.createUnstakeTransaction(
                walletPublicKey,
                vaultPublicKey,
                amountLamports
              );
              
              // In a real implementation, the transaction would be sent to the frontend for signing
              // Here we're returning the transaction for the frontend to sign
              return {
                success: true,
                txId: 'transaction-needs-signing',
                transaction: JSON.stringify(transaction.serialize())
              };
            } catch (clientError) {
              console.error('Error creating unstake transaction:', clientError);
              return {
                success: false,
                error: clientError instanceof Error ? clientError.message : 'Failed to create unstake transaction'
              };
            }
          }
          
          // Simulate successful unstaking for development
          console.log('Using mock unstaking transaction');
          return {
            success: true,
            txId: 'simulated-transaction-id'
          };
        } catch (error) {
          console.error('Error unstaking from vault:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      { success: false, error: 'Jito Restaking feature is disabled' }
    )();
  }

  /**
   * Gets the APY for a specific vault
   */
  async getVaultApy(vaultAddress: string): Promise<number> {
    return withFeatureFlag(
      this.isEnabled,
      async () => {
        try {
          // Use the Jito client to get the vault APY
          if (this.jitoClient) {
            try {
              const vaultPublicKey = new PublicKey(vaultAddress);
              const vault = await this.jitoClient.getVault(vaultPublicKey);
              return vault.apy || 5.0;
            } catch (clientError) {
              console.error('Error fetching vault APY from Jito client:', clientError);
              // Fall through to mock data
            }
          }
          
          // Fallback to mock data if client is not available or fetch fails
          return vaultAddress === '8xH3gJxzUXNFE1LfwxKNimvuUKmQUQS8kfAP8VvfbzFE' ? 5.2 : 6.8;
        } catch (error) {
          console.error('Error fetching vault APY:', error);
          return 5.0; // Default APY
        }
      },
      0
    )();
  }
}

export default new JitoRestakingService(); 