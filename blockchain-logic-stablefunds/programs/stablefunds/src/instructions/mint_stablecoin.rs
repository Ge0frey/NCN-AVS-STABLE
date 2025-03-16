use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, MintTo, mint_to},
    associated_token::AssociatedToken,
};
use crate::{
    state::{StablecoinConfig, StablecoinVault, UserStablecoin},
    errors::StablefundsError,
};

#[derive(Accounts)]
#[instruction(amount: u64, user_stablecoin_bump: u8)]
pub struct MintStablecoin<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = stablecoin_config.authority == user.key() @ StablefundsError::UnauthorizedOperation
    )]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        mut,
        seeds = [
            b"stablecoin-vault",
            stablecoin_config.key().as_ref(),
        ],
        bump = stablecoin_vault.bump,
    )]
    pub stablecoin_vault: Account<'info, StablecoinVault>,

    #[account(
        mut,
        constraint = stablecoin_mint.key() == stablecoin_config.mint @ StablefundsError::InvalidMintAuthority
    )]
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = stablecoin_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserStablecoin::space(),
        seeds = [
            b"user-stablecoin",
            user.key().as_ref(),
            stablecoin_config.key().as_ref(),
        ],
        bump,
    )]
    pub user_stablecoin: Account<'info, UserStablecoin>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn mint_stablecoin(
    ctx: &mut Context<MintStablecoin>,
    amount: u64,
    user_stablecoin_bump: u8,
) -> Result<()> {
    // Validate amount
    if amount == 0 {
        return Err(StablefundsError::InvalidInitialSupply.into());
    }

    // Check if there's enough collateral to mint the requested amount
    let stablecoin_config = &ctx.accounts.stablecoin_config;
    let stablecoin_vault = &ctx.accounts.stablecoin_vault;
    
    // Calculate the maximum amount that can be minted based on current collateral
    // Formula: collateral_amount * collateral_price / collateralization_ratio * 100
    let collateral_price = 1_000_000; // Assume 1:1 value for now, in a real app we'd query the price
    let max_mintable_amount = stablecoin_vault.collateral_amount
        .checked_mul(collateral_price)
        .unwrap()
        .checked_div(1_000_000) // Adjust for decimal precision
        .unwrap()
        .checked_mul(100)
        .unwrap()
        .checked_div(stablecoin_config.collateralization_ratio)
        .unwrap();
    
    // Calculate the already minted amount
    let already_minted = stablecoin_config.total_supply;
    
    // Calculate how much more can be minted
    let remaining_mintable = max_mintable_amount.saturating_sub(already_minted);
    
    if amount > remaining_mintable {
        return Err(StablefundsError::InsufficientCollateral.into());
    }

    // Mint stablecoin tokens to user
    let seeds = [
        b"stablecoin-config",
        stablecoin_config.name.as_bytes(),
        stablecoin_config.symbol.as_bytes(),
        stablecoin_config.authority.as_ref(),
        &[stablecoin_config.bump],
    ];

    let signer = &[&seeds[..]];
    
    let cpi_accounts = MintTo {
        mint: ctx.accounts.stablecoin_mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.stablecoin_config.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    mint_to(cpi_ctx, amount)?;

    // Update stablecoin config total supply
    let stablecoin_config = &mut ctx.accounts.stablecoin_config;
    stablecoin_config.total_supply = stablecoin_config.total_supply.checked_add(amount)
        .ok_or(error!(StablefundsError::InvalidStablecoinState))?;

    // Initialize or update user stablecoin account
    let user_stablecoin = &mut ctx.accounts.user_stablecoin;
    
    if user_stablecoin.owner == Pubkey::default() {
        // First time initialization
        user_stablecoin.owner = ctx.accounts.user.key();
        user_stablecoin.stablecoin_config = stablecoin_config.key();
        user_stablecoin.token_account = ctx.accounts.user_token_account.key();
        user_stablecoin.amount = amount;
        user_stablecoin.bump = user_stablecoin_bump;
    } else {
        // Update existing account
        user_stablecoin.amount = user_stablecoin.amount.checked_add(amount)
            .ok_or(error!(StablefundsError::InvalidStablecoinState))?;
    }
    
    user_stablecoin.last_updated = Clock::get()?.unix_timestamp;

    // Emit mint event
    emit!(StablecoinMintedEvent {
        stablecoin_config: stablecoin_config.key(),
        user: ctx.accounts.user.key(),
        amount,
        total_supply: stablecoin_config.total_supply,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// Event emitted when stablecoin is minted
#[event]
pub struct StablecoinMintedEvent {
    pub stablecoin_config: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub total_supply: u64,
    pub timestamp: i64,
} 