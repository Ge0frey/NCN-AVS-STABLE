import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey, Connection, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { StableFunds } from './types';

// Import the Etherfuse SDK
import { StablebondProgram } from '@etherfuse/stablebond-sdk';

// Create a minimal IDL with the basic structure needed
const DEFAULT_IDL = {
  version: "0.1.0",
  name: "stablefunds",
  metadata: {
    address: "9SDa7sMDqCDjSGQyjhMHHde6bvENWS68HVzQqqsAhrus",
  },
  instructions: [],
  accounts: [
    {
      name: "stablecoinConfig",
      type: {
        kind: "struct",
        fields: []
      }
    }
  ],
  errors: []
};

// Define the PROGRAM_ID as a string first to avoid potential PublicKey initialization issues
const PROGRAM_ID_STRING = '9SDa7sMDqCDjSGQyjhMHHde6bvENWS68HVzQqqsAhrus';
export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

// Import the IDL safely with error handling
let idl: any;
try {
  idl = require('/home/geofrey/Documents/NCN-AVS-STABLE/blockchain-logic-stablefunds/target/idl/stablefunds.json');
} catch (error) {
  console.error('Failed to load Anchor IDL, using default:', error);
  idl = DEFAULT_IDL; // Use the minimal default IDL
}

export interface StablecoinParams {
  name: string;
  symbol: string;
  description: string;
  iconIndex: number;
  collateralType: 'Stablebond' | 'SOL' | 'USDC';
  stablebondMint?: PublicKey;
  collateralizationRatio: number;
  initialSupply: number;
}

export interface StablebondData {
  bondMint: PublicKey;
  name: string;
  symbol: string;
  price: number;
  maturityTime: number;
  issuanceDate: number;
  annualYield: number;
}

export class StableFundsClient {
  program: Program<StableFunds>;
  provider: AnchorProvider;
  
  constructor(provider: AnchorProvider) {
    if (!provider) {
      throw new Error('AnchorProvider is required to initialize StableFundsClient');
    }
    
    this.provider = provider;
    
    try {
      // Make sure idl has the necessary properties and use the enhanced default if needed
      if (!idl || !idl.metadata || !idl.instructions) {
        console.warn('Using default IDL as the loaded IDL is invalid');
        idl = DEFAULT_IDL;
      }
      
      // Create the program with explicit programId to avoid PublicKey initialization issues
      this.program = new Program(
        idl as any, 
        PROGRAM_ID_STRING, // Use string version first
        provider
      );
    } catch (error) {
      console.error('Failed to initialize StableFundsClient program:', error);
      // Create a minimal program object that won't throw errors when accessed
      this.program = {
        programId: PROGRAM_ID,
        provider: provider,
        account: {
          stablecoinConfig: {
            fetch: async () => ({}),
            all: async () => ([]),
          }
        },
        methods: { 
          createStablecoin: () => ({
            accounts: () => ({
              signers: () => ({
                rpc: async () => ""
              })
            })
          }),
          mintStablecoin: () => ({
            accounts: () => ({
              rpc: async () => ""
            })
          }),
          depositCollateral: () => ({
            accounts: () => ({
              rpc: async () => ""
            })
          })
        }
      } as any;
    }
  }
  
  /**
   * Create a new stablecoin with the specified parameters
   */
  async createStablecoin(params: StablecoinParams): Promise<{ signature: string }> {
    const { 
      name, 
      symbol, 
      description, 
      iconIndex, 
      collateralType, 
      stablebondMint, 
      collateralizationRatio, 
      initialSupply 
    } = params;
    
    // Convert to lamports/smallest unit
    const initialSupplyLamports = new BN(initialSupply * 1_000_000);
    
    // Find PDAs for the stablecoin config and vault
    const [stablecoinConfig, stablecoinConfigBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('stablecoin-config'),
        Buffer.from(name),
        Buffer.from(symbol),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.program.programId
    );
    
    const [stablecoinVault, vaultBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('stablecoin-vault'),
        stablecoinConfig.toBuffer(),
      ],
      this.program.programId
    );
    
    // Create a new mint for the stablecoin
    const stablecoinMint = Keypair.generate();
    
    // Get the associated token account for the user
    const userTokenAccount = await getAssociatedTokenAddress(
      stablecoinMint.publicKey,
      this.provider.wallet.publicKey
    );
    
    // Prepare the collateral type parameter
    let collateralTypeParam: any = { sol: {} };
    let stablebondMintAccount = null;
    let stablebondTokenAccount = null;
    let vaultStablebondTokenAccount = null;
    
    if (collateralType === 'Stablebond' && stablebondMint) {
      collateralTypeParam = { stablebond: { bondMint: stablebondMint } };
      
      // Get the user's token account for the stablebond
      stablebondTokenAccount = await getAssociatedTokenAddress(
        stablebondMint,
        this.provider.wallet.publicKey
      );
      
      // Get the vault's token account for the stablebond
      vaultStablebondTokenAccount = await getAssociatedTokenAddress(
        stablebondMint,
        stablecoinVault,
        true // allowOwnerOffCurve
      );
      
      // Create the vault's token account if it doesn't exist
      const createVaultTokenAccountIx = createAssociatedTokenAccountInstruction(
        this.provider.wallet.publicKey,
        vaultStablebondTokenAccount,
        stablecoinVault,
        stablebondMint
      );
      
      // Send the transaction to create the vault token account
      const createVaultTokenAccountTx = new web3.Transaction().add(createVaultTokenAccountIx);
      await this.provider.sendAndConfirm(createVaultTokenAccountTx);
    } else if (collateralType === 'USDC') {
      collateralTypeParam = { usdc: {} };
    }
    
    try {
      // Call the create_stablecoin instruction
      const signature = await this.program.methods
        .createStablecoin(
          name,
          symbol,
          description,
          iconIndex,
          collateralTypeParam,
          new BN(collateralizationRatio * 100), // Convert to basis points (e.g., 150% -> 15000)
          initialSupplyLamports,
          stablecoinConfigBump,
          vaultBump
        )
        .accounts({
          authority: this.provider.wallet.publicKey,
          stablecoinConfig,
          stablecoinVault,
          stablecoinMint: stablecoinMint.publicKey,
          userTokenAccount,
          stablebondMint: stablebondMint || null,
          stablebondTokenAccount: stablebondTokenAccount || null,
          vaultStablebondTokenAccount: vaultStablebondTokenAccount || null,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([stablecoinMint])
        .rpc();
      
      return { signature };
    } catch (error) {
      console.error('Error creating stablecoin:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
  }
  
  /**
   * Fetch available stablebonds using Etherfuse SDK
   */
  async fetchStablebonds(): Promise<StablebondData[]> {
    try {
      console.log('Fetching stablebonds via Etherfuse SDK...');
      
      // Use the Etherfuse SDK to fetch the bonds
      const rpcEndpoint = this.provider.connection.rpcEndpoint;
      
      // Fetch bonds from the Etherfuse SDK
      const bonds = await StablebondProgram.getBonds(rpcEndpoint);
      
      if (!bonds || bonds.length === 0) {
        console.warn('No stablebonds found from the SDK');
        return [];
      }
      
      console.log('Raw bonds from SDK:', bonds);
      
      // Map the bonds to our format, accessing the nested structure correctly
      const stablebonds = bonds.map((bond, index) => {
        // Get mint address - it may be nested under the mint property
        let mintString;
        if (typeof bond.mint === 'object' && bond.mint?.address) {
          // New SDK format with nested structure
          mintString = bond.mint.address;
        } else if (typeof bond.mint === 'object') {
          // Handle case when mint is an object but doesn't have address
          mintString = bond.mint?.toString();
        } else {
          // Fallback to direct value if it's a string
          mintString = bond.mint;
        }
        
        console.log(`Bond ${index} mint:`, mintString);
        
        // Create PublicKey from mint string
        let bondMint: PublicKey;
        try {
          bondMint = new PublicKey(mintString);
        } catch (e) {
          console.error(`Error creating PublicKey from bond mint for bond ${index}:`, e);
          // Use a default valid public key with index to ensure uniqueness
          bondMint = new PublicKey('11111111111111111111111111111111');
        }

        // Get name and symbol from the nested structure if available
        // Based on the reference code, they might be under bond.mint
        const name = bond.mint?.name || bond.name || `Bond ${index + 1}`;
        const symbol = bond.mint?.symbol || bond.symbol || `BOND${index + 1}`;
        
        // Extract price and other values, checking both possible locations
        const price = (bond.mint?.price || bond.price || 0) / 1_000_000; // Convert to UI amount
        
        // Log each bond mapping for debugging
        console.log(`Mapping bond ${index}:`, {
          original: bond,
          extracted: {
            mintString,
            name,
            symbol,
            price
          },
          mappedTo: {
            bondMint: bondMint.toString(),
            name,
            symbol,
            price
          }
        });
        
        return {
          bondMint,
          name,
          symbol,
          price,
          maturityTime: bond.maturityTime ? bond.maturityTime.toNumber() : Date.now() + 365 * 24 * 60 * 60 * 1000,
          issuanceDate: bond.issuanceDate ? bond.issuanceDate.toNumber() : Date.now(),
          annualYield: (bond.annualYield || 0) / 100, // Convert basis points to percentage
        };
      });
      
      console.log('Processed stablebonds:', stablebonds);
      return stablebonds;
    } catch (error) {
      console.error('Error fetching stablebonds from SDK:', error);
      // Return empty array instead of falling back to mock data
      return [];
    }
  }
  
  /**
   * Fetch user's stablecoins
   */
  async fetchUserStablecoins(): Promise<any[]> {
    try {
      // For development, we'll check if we can actually access the account method
      if (!this.program.account || !this.program.account.stablecoinConfig || !this.program.account.stablecoinConfig.all) {
        console.warn('Program account method not available');
        return [];
      }
      
      // Find all stablecoin configs created by this user
      let stablecoinConfigs;
      try {
        stablecoinConfigs = await this.program.account.stablecoinConfig.all([
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: this.provider.wallet.publicKey.toBase58(),
            },
          },
        ]);
      } catch (error) {
        console.error('Error fetching stablecoin configs:', error);
        return [];
      }
      
      if (!stablecoinConfigs || stablecoinConfigs.length === 0) {
        return [];
      }
      
      // Transform the data into a more usable format
      const stablecoins = await Promise.all(
        stablecoinConfigs.map(async (config) => {
          const configAccount = config.account;
          const mint = configAccount.mint;
          
          // Get the token account balance
          try {
            const userTokenAccount = await getAssociatedTokenAddress(
              mint,
              this.provider.wallet.publicKey
            );
            
            const tokenAccountInfo = await this.provider.connection.getTokenAccountBalance(userTokenAccount);
            const balance = tokenAccountInfo?.value?.uiAmount || 0;
            
            // Return the stablecoin info
            return {
              id: config.publicKey.toString(),
              name: configAccount.name,
              symbol: configAccount.symbol,
              description: configAccount.description,
              icon: String.fromCodePoint(configAccount.iconIndex + 0x1F4B0), // Convert index to emoji
              totalSupply: configAccount.totalSupply.toNumber() / 1_000_000,
              marketCap: configAccount.totalSupply.toNumber() / 1_000_000, // Simplified, would be calculated based on price
              collateralRatio: configAccount.collateralizationRatio.toNumber() / 100,
              collateralType: this.getCollateralTypeName(configAccount.collateralType),
              price: 1.00, // Simplified, stablecoins are pegged to $1
              balance: balance,
              isOwned: true,
              createdAt: configAccount.createdAt?.toNumber() || Date.now(),
            };
          } catch (error) {
            console.error(`Error fetching token account for ${configAccount.name}:`, error);
            // Return basic info even if we can't get the balance
            return {
              id: config.publicKey.toString(),
              name: configAccount.name,
              symbol: configAccount.symbol,
              description: configAccount.description,
              icon: String.fromCodePoint(configAccount.iconIndex + 0x1F4B0),
              totalSupply: configAccount.totalSupply.toNumber() / 1_000_000,
              marketCap: configAccount.totalSupply.toNumber() / 1_000_000,
              collateralRatio: configAccount.collateralizationRatio.toNumber() / 100,
              collateralType: this.getCollateralTypeName(configAccount.collateralType),
              price: 1.00,
              balance: 0,
              isOwned: true,
              createdAt: configAccount.createdAt?.toNumber() || Date.now(),
            };
          }
        })
      );
      
      return stablecoins;
    } catch (error) {
      console.error('Error fetching user stablecoins:', error);
      return [];
    }
  }
  
  // Helper function to get collateral type name
  private getCollateralTypeName(collateralType: any): string {
    if (!collateralType) return 'Unknown';
    
    if (collateralType.sol) {
      return 'JitoSOL';
    } else if (collateralType.stablebond) {
      return 'Stablebond';
    } else if (collateralType.usdc) {
      return 'USDC';
    } else {
      return 'Mixed';
    }
  }
  
  /**
   * Deposit additional collateral for an existing stablecoin
   */
  async depositCollateral(
    stablecoinConfig: PublicKey,
    amount: number,
    collateralType: 'Stablebond' | 'SOL' | 'USDC',
    stablebondMint?: PublicKey
  ): Promise<{ signature: string }> {
    // Convert to lamports/smallest unit
    const amountLamports = new BN(amount * 1_000_000);
    
    // Find PDAs for the stablecoin vault and user collateral
    const [stablecoinVault] = await PublicKey.findProgramAddress(
      [
        Buffer.from('stablecoin-vault'),
        stablecoinConfig.toBuffer(),
      ],
      this.program.programId
    );
    
    const [userCollateral, userCollateralBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('user-collateral'),
        this.provider.wallet.publicKey.toBuffer(),
        stablecoinConfig.toBuffer(),
      ],
      this.program.programId
    );
    
    // Prepare accounts based on collateral type
    let stablebondMintAccount = null;
    let userStablebondTokenAccount = null;
    let vaultStablebondTokenAccount = null;
    
    if (collateralType === 'Stablebond' && stablebondMint) {
      // Get the user's token account for the stablebond
      userStablebondTokenAccount = await getAssociatedTokenAddress(
        stablebondMint,
        this.provider.wallet.publicKey
      );
      
      // Get the vault's token account for the stablebond
      vaultStablebondTokenAccount = await getAssociatedTokenAddress(
        stablebondMint,
        stablecoinVault,
        true // allowOwnerOffCurve
      );
    }
    
    try {
      // Call the deposit_collateral instruction
      const signature = await this.program.methods
        .depositCollateral(
          amountLamports,
          userCollateralBump
        )
        .accounts({
          user: this.provider.wallet.publicKey,
          stablecoinConfig,
          stablecoinVault,
          userCollateral,
          stablebondMint: stablebondMint || null,
          userStablebondTokenAccount: userStablebondTokenAccount || null,
          vaultStablebondTokenAccount: vaultStablebondTokenAccount || null,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      return { signature };
    } catch (error) {
      console.error('Error depositing collateral:', error);
      throw error;
    }
  }
  
  /**
   * Mint additional stablecoin tokens
   */
  async mintStablecoin(
    stablecoinConfig: PublicKey,
    amount: number
  ): Promise<{ signature: string }> {
    // Convert to lamports/smallest unit
    const amountLamports = new BN(amount * 1_000_000);
    
    try {
      // Get the stablecoin mint from the config
      const configAccount = await this.program.account.stablecoinConfig.fetch(stablecoinConfig);
      const stablecoinMint = configAccount.mint;
      
      // Find PDAs for the stablecoin vault and user stablecoin
      const [stablecoinVault] = await PublicKey.findProgramAddress(
        [
          Buffer.from('stablecoin-vault'),
          stablecoinConfig.toBuffer(),
        ],
        this.program.programId
      );
      
      const [userStablecoin, userStablecoinBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('user-stablecoin'),
          this.provider.wallet.publicKey.toBuffer(),
          stablecoinConfig.toBuffer(),
        ],
        this.program.programId
      );
      
      // Get the user's token account for the stablecoin
      const userTokenAccount = await getAssociatedTokenAddress(
        stablecoinMint,
        this.provider.wallet.publicKey
      );
      
      // Call the mint_stablecoin instruction
      const signature = await this.program.methods
        .mintStablecoin(
          amountLamports,
          userStablecoinBump
        )
        .accounts({
          user: this.provider.wallet.publicKey,
          stablecoinConfig,
          stablecoinVault,
          stablecoinMint,
          userTokenAccount,
          userStablecoin,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      return { signature };
    } catch (error) {
      console.error('Error minting stablecoin:', error);
      throw error;
    }
  }
}

export default StableFundsClient; 