import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Stablefunds } from "../target/types/stablefunds";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";
import { expect } from "chai";

describe("stablefunds", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Stablefunds as Program<Stablefunds>;
  const wallet = provider.wallet as anchor.Wallet;

  // Test data
  const stablecoinName = "Test USD";
  const stablecoinSymbol = "TUSD";
  const stablecoinDescription = "A test stablecoin for development";
  const iconIndex = 1;
  const collateralizationRatio = 150; // 150%
  const initialSupply = 1000 * 1_000_000; // 1000 tokens with 6 decimals

  // Test accounts
  let stablecoinMint: Keypair;
  let stablebondMint: Keypair;
  let userStablebondTokenAccount: PublicKey;
  let stablecoinConfig: PublicKey;
  let stablecoinConfigBump: number;
  let stablecoinVault: PublicKey;
  let vaultBump: number;
  let vaultStablebondTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;

  before(async () => {
    // Create a stablebond mint for testing
    stablebondMint = Keypair.generate();
    await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6,
      stablebondMint
    );

    // Create a token account for the user's stablebond
    const userStablebondAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      stablebondMint.publicKey,
      wallet.publicKey
    );
    userStablebondTokenAccount = userStablebondAccount.address;

    // Mint some stablebonds to the user
    await mintTo(
      provider.connection,
      wallet.payer,
      stablebondMint.publicKey,
      userStablebondTokenAccount,
      wallet.payer,
      10000 * 1_000_000 // 10000 tokens with 6 decimals
    );

    // Create a keypair for the stablecoin mint
    stablecoinMint = Keypair.generate();

    // Find PDAs
    [stablecoinConfig, stablecoinConfigBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stablecoin-config"),
        Buffer.from(stablecoinName),
        Buffer.from(stablecoinSymbol),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    [stablecoinVault, vaultBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stablecoin-vault"),
        stablecoinConfig.toBuffer(),
      ],
      program.programId
    );

    // Get the associated token account for the user's stablecoin
    userTokenAccount = await getAssociatedTokenAddress(
      stablecoinMint.publicKey,
      wallet.publicKey
    );

    // Get the vault's token account for the stablebond
    vaultStablebondTokenAccount = await getAssociatedTokenAddress(
      stablebondMint.publicKey,
      stablecoinVault,
      true // allowOwnerOffCurve
    );
  });

  it("Creates a stablecoin", async () => {
    // Call the create_stablecoin instruction
    await program.methods
      .createStablecoin(
        stablecoinName,
        stablecoinSymbol,
        stablecoinDescription,
        iconIndex,
        { stablebond: { bondMint: stablebondMint.publicKey } },
        new anchor.BN(collateralizationRatio),
        new anchor.BN(initialSupply),
        stablecoinConfigBump,
        vaultBump
      )
      .accounts({
        authority: wallet.publicKey,
        stablecoinConfig,
        stablecoinVault,
        stablecoinMint: stablecoinMint.publicKey,
        userTokenAccount,
        stablebondMint: stablebondMint.publicKey,
        stablebondTokenAccount: userStablebondTokenAccount,
        vaultStablebondTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([stablecoinMint])
      .rpc();

    // Fetch the stablecoin config account
    const stablecoinConfigAccount = await program.account.stablecoinConfig.fetch(stablecoinConfig);
    
    // Verify the stablecoin config account
    expect(stablecoinConfigAccount.name).to.equal(stablecoinName);
    expect(stablecoinConfigAccount.symbol).to.equal(stablecoinSymbol);
    expect(stablecoinConfigAccount.description).to.equal(stablecoinDescription);
    expect(stablecoinConfigAccount.iconIndex).to.equal(iconIndex);
    expect(stablecoinConfigAccount.collateralizationRatio.toNumber()).to.equal(collateralizationRatio);
    expect(stablecoinConfigAccount.totalSupply.toNumber()).to.equal(initialSupply);
    expect(stablecoinConfigAccount.mint.toString()).to.equal(stablecoinMint.publicKey.toString());
    expect(stablecoinConfigAccount.authority.toString()).to.equal(wallet.publicKey.toString());
  });

  it("Deposits additional collateral", async () => {
    // Find the user collateral PDA
    const [userCollateral, userCollateralBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("user-collateral"),
        wallet.publicKey.toBuffer(),
        stablecoinConfig.toBuffer(),
      ],
      program.programId
    );

    // Get the initial vault collateral amount
    const initialVault = await program.account.stablecoinVault.fetch(stablecoinVault);
    const initialCollateralAmount = initialVault.collateralAmount.toNumber();

    // Deposit additional collateral
    const additionalCollateral = 500 * 1_000_000; // 500 tokens with 6 decimals
    
    await program.methods
      .depositCollateral(
        new anchor.BN(additionalCollateral),
        userCollateralBump
      )
      .accounts({
        user: wallet.publicKey,
        stablecoinConfig,
        stablecoinVault,
        userCollateral,
        stablebondMint: stablebondMint.publicKey,
        userStablebondTokenAccount,
        vaultStablebondTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Fetch the updated vault
    const updatedVault = await program.account.stablecoinVault.fetch(stablecoinVault);
    
    // Verify the collateral amount increased
    expect(updatedVault.collateralAmount.toNumber()).to.equal(initialCollateralAmount + additionalCollateral);
  });

  it("Mints additional stablecoin tokens", async () => {
    // Find the user stablecoin PDA
    const [userStablecoin, userStablecoinBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("user-stablecoin"),
        wallet.publicKey.toBuffer(),
        stablecoinConfig.toBuffer(),
      ],
      program.programId
    );

    // Get the initial stablecoin config
    const initialConfig = await program.account.stablecoinConfig.fetch(stablecoinConfig);
    const initialTotalSupply = initialConfig.totalSupply.toNumber();

    // Mint additional stablecoin tokens
    const additionalSupply = 200 * 1_000_000; // 200 tokens with 6 decimals
    
    await program.methods
      .mintStablecoin(
        new anchor.BN(additionalSupply),
        userStablecoinBump
      )
      .accounts({
        user: wallet.publicKey,
        stablecoinConfig,
        stablecoinVault,
        stablecoinMint: stablecoinMint.publicKey,
        userTokenAccount,
        userStablecoin,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Fetch the updated config
    const updatedConfig = await program.account.stablecoinConfig.fetch(stablecoinConfig);
    
    // Verify the total supply increased
    expect(updatedConfig.totalSupply.toNumber()).to.equal(initialTotalSupply + additionalSupply);
  });
});
