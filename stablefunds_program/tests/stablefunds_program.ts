import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StablefundsProgram } from "../target/types/stablefunds_program";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

describe("stablefunds_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.StablefundsProgram as Program<StablefundsProgram>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const wallet = provider.wallet;

  it("Creates a stablecoin", async () => {
    // Generate a new keypair for the stablecoin mint
    const stablecoinMint = Keypair.generate();
    
    // Stablecoin parameters
    const name = "US Dollar Fund";
    const symbol = "USDF";
    const description = "A stable cryptocurrency pegged to the US Dollar";
    const iconIndex = 0;
    const collateralType = { sol: {} }; // Using SOL as collateral
    const collateralizationRatio = 15000; // 150%
    const initialSupply = 1000000000; // 1000 tokens with 6 decimals
    
    // Find PDAs
    const [stablecoinConfig, stablecoinConfigBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stablecoin-config"),
        Buffer.from(name),
        Buffer.from(symbol),
        wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    const [stablecoinVault, vaultBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stablecoin-vault"),
        stablecoinConfig.toBuffer(),
      ],
      program.programId
    );
    
    // Get the associated token account for the user
    const userTokenAccount = await anchor.utils.token.associatedAddress({
      mint: stablecoinMint.publicKey,
      owner: wallet.publicKey,
    });
    
    // Create the stablecoin
    const tx = await program.methods
      .createStablecoin(
        name,
        symbol,
        description,
        iconIndex,
        collateralType,
        collateralizationRatio,
        initialSupply,
        stablecoinConfigBump,
        vaultBump
      )
      .accounts({
        authority: wallet.publicKey,
        stablecoinConfig,
        stablecoinVault,
        stablecoinMint: stablecoinMint.publicKey,
        userTokenAccount,
        stablebondMint: null,
        stablebondTokenAccount: null,
        vaultStablebondTokenAccount: null,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([stablecoinMint])
      .rpc();
    
    console.log("Your transaction signature", tx);
    
    // Fetch the stablecoin config to verify it was created correctly
    const stablecoinConfigAccount = await program.account.stablecoinConfig.fetch(stablecoinConfig);
    
    // Verify the stablecoin config was initialized correctly
    expect(stablecoinConfigAccount.name).to.equal(name);
    expect(stablecoinConfigAccount.symbol).to.equal(symbol);
    expect(stablecoinConfigAccount.description).to.equal(description);
    expect(stablecoinConfigAccount.iconIndex).to.equal(iconIndex);
    expect(stablecoinConfigAccount.totalSupply.toString()).to.equal(initialSupply.toString());
    
    console.log("Stablecoin created successfully!");
  });
});
