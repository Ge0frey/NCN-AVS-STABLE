import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey, Connection, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { StableFunds } from './types';
import idl from '/home/geofrey/Documents/NCN-AVS-STABLE/blockchain-logic-stablefunds/target/idl/stablefunds.json';

// Etherfuse SDK integration
import { StablebondProgram } from '@etherfuse/stablebond-sdk';

// Program ID for the StableFunds program
export const PROGRAM_ID = new PublicKey('9SDa7sMDqCDjSGQyjhMHHde6bvENWS68HVzQqqsAhrus');

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
    this.provider = provider;
    this.program = new Program(idl as any, PROGRAM_ID, provider);
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
  }
  
  /**
   * Fetch available stablebonds from Etherfuse
   */
  async fetchStablebonds(): Promise<StablebondData[]> {
    try {
      // In a real implementation, this would use the Etherfuse SDK
      // For now, we'll call our program's fetch_stablebonds instruction
      
      // Find the PDA for the stablebond list
      const [stablebondList, stablebondListBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('stablebond-list'),
          this.provider.wallet.publicKey.toBuffer(),
        ],
        this.program.programId
      );
      
      // Call the fetch_stablebonds instruction
      const signature = await this.program.methods
        .fetchStablebonds()
        .accounts({
          user: this.provider.wallet.publicKey,
          stablebondList,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Fetch the account data
      const accountInfo = await this.provider.connection.getAccountInfo(stablebondList);
      
      if (!accountInfo || !accountInfo.data) {
        return [];
      }
      
      // Parse the stablebond list
      const data = accountInfo.data;
      const countBuffer = data.slice(0, 4);
      const count = new BN(countBuffer, 'le').toNumber();
      
      const stablebonds: StablebondData[] = [];
      let offset = 4;
      
      for (let i = 0; i < count; i++) {
        // This is a simplified parsing logic - in a real implementation,
        // we would use a proper deserializer based on the Anchor IDL
        const bondMintBuffer = data.slice(offset, offset + 32);
        offset += 32;
        
        // Parse name (string with length prefix)
        const nameLength = new BN(data.slice(offset, offset + 4), 'le').toNumber();
        offset += 4;
        const name = data.slice(offset, offset + nameLength).toString('utf8');
        offset += nameLength;
        
        // Parse symbol (string with length prefix)
        const symbolLength = new BN(data.slice(offset, offset + 4), 'le').toNumber();
        offset += 4;
        const symbol = data.slice(offset, offset + symbolLength).toString('utf8');
        offset += symbolLength;
        
        // Parse price (u64)
        const price = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 1_000_000;
        offset += 8;
        
        // Parse maturity_time (i64)
        const maturityTime = new BN(data.slice(offset, offset + 8), 'le').toNumber();
        offset += 8;
        
        // Parse issuance_date (i64)
        const issuanceDate = new BN(data.slice(offset, offset + 8), 'le').toNumber();
        offset += 8;
        
        // Parse annual_yield (u64)
        const annualYield = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 100;
        offset += 8;
        
        stablebonds.push({
          bondMint: new PublicKey(bondMintBuffer),
          name,
          symbol,
          price,
          maturityTime,
          issuanceDate,
          annualYield,
        });
      }
      
      return stablebonds;
    } catch (error) {
      console.error('Error fetching stablebonds:', error);
      return [];
    }
  }
  
  /**
   * Fetch real stablebonds from Etherfuse SDK
   * This would be used in a production environment
   */
  async fetchRealStablebonds(rpcEndpoint: string): Promise<StablebondData[]> {
    try {
      // Use the Etherfuse SDK to fetch real stablebonds
      const bonds = await StablebondProgram.getBonds(rpcEndpoint);
      
      // Convert to our format
      return bonds.map(bond => ({
        bondMint: new PublicKey(bond.mint),
        name: bond.name,
        symbol: bond.symbol,
        price: bond.price / 1_000_000, // Convert to UI amount
        maturityTime: bond.maturityTime.toNumber(),
        issuanceDate: bond.issuanceDate.toNumber(),
        annualYield: bond.annualYield / 100, // Convert basis points to percentage
      }));
    } catch (error) {
      console.error('Error fetching real stablebonds:', error);
      return [];
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
  }
}

export default StableFundsClient; 