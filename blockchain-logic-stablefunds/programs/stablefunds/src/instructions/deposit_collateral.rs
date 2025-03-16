use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, Transfer, transfer},
    associated_token::AssociatedToken,
};
use crate::{
    state::{StablecoinConfig, StablecoinVault, UserCollateral, UserCollateralType},
    errors::StablefundsError,
};

#[derive(Accounts)]
#[instruction(amount: u64, user_collateral_bump: u8)]
pub struct DepositCollateral<'info> {
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
        init_if_needed,
        payer = user,
        space = UserCollateral::space(),
        seeds = [
            b"user-collateral",
            user.key().as_ref(),
            stablecoin_config.key().as_ref(),
        ],
        bump,
    )]
    pub user_collateral: Account<'info, UserCollateral>,

    // When collateral is a Stablebond
    #[account(
        mut,
        constraint = 
            match stablecoin_config.collateral_type {
                crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                    bond_mint == stablebond_mint.key(),
                _ => true
            }
    )]
    pub stablebond_mint: Option<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = 
            match stablecoin_config.collateral_type {
                crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                    user_stablebond_token_account.mint == bond_mint &&
                    user_stablebond_token_account.owner == user.key(),
                _ => true
            }
    )]
    pub user_stablebond_token_account: Option<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = 
            match stablecoin_config.collateral_type {
                crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                    vault_stablebond_token_account.mint == bond_mint &&
                    vault_stablebond_token_account.owner == stablecoin_vault.key(),
                _ => true
            }
    )]
    pub vault_stablebond_token_account: Option<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn deposit_collateral(
    ctx: &mut Context<DepositCollateral>,
    amount: u64,
    user_collateral_bump: u8,
) -> Result<()> {
    // Validate amount
    if amount == 0 {
        return Err(StablefundsError::InsufficientCollateral.into());
    }

    // Process collateral deposit based on type
    match ctx.accounts.stablecoin_config.collateral_type {
        crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => {
            // Get required accounts for Stablebond collateral
            let user_stablebond_token_account = ctx.accounts.user_stablebond_token_account
                .as_ref()
                .ok_or(StablefundsError::InvalidStablebondMint)?;
                
            let vault_stablebond_token_account = ctx.accounts.vault_stablebond_token_account
                .as_ref()
                .ok_or(StablefundsError::InvalidStablebondMint)?;

            // Check that user has enough Stablebond tokens
            if user_stablebond_token_account.amount < amount {
                return Err(StablefundsError::InsufficientStablebondTokens.into());
            }

            // Transfer Stablebond tokens from user to vault
            let cpi_accounts = Transfer {
                from: user_stablebond_token_account.to_account_info(),
                to: vault_stablebond_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            
            transfer(cpi_ctx, amount)?;

            // Initialize or update user collateral account
            let user_collateral = &mut ctx.accounts.user_collateral;
            
            if user_collateral.owner == Pubkey::default() {
                // First time initialization
                user_collateral.owner = ctx.accounts.user.key();
                user_collateral.stablecoin_config = ctx.accounts.stablecoin_config.key();
                user_collateral.collateral_amount = amount;
                user_collateral.collateral_type = UserCollateralType::Stablebond {
                    bond_mint,
                    bond_account: user_stablebond_token_account.key(),
                };
                user_collateral.bump = user_collateral_bump;
            } else {
                // Update existing account
                user_collateral.collateral_amount = user_collateral.collateral_amount.checked_add(amount)
                    .ok_or(error!(StablefundsError::InvalidStablecoinState))?;
            }
            
            user_collateral.last_updated = Clock::get()?.unix_timestamp;

            // Update vault collateral amount
            let stablecoin_vault = &mut ctx.accounts.stablecoin_vault;
            stablecoin_vault.collateral_amount = stablecoin_vault.collateral_amount.checked_add(amount)
                .ok_or(error!(StablefundsError::InvalidStablecoinState))?;
            stablecoin_vault.last_updated = Clock::get()?.unix_timestamp;
        },
        _ => {
            // For now, only implement Stablebond collateral
            return Err(StablefundsError::UnsupportedCollateralType.into());
        }
    }

    // Emit deposit event
    emit!(CollateralDepositedEvent {
        stablecoin_config: ctx.accounts.stablecoin_config.key(),
        user: ctx.accounts.user.key(),
        amount,
        collateral_type: match ctx.accounts.stablecoin_config.collateral_type {
            crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                format!("Stablebond: {}", bond_mint),
            crate::state::stablecoin::CollateralType::SOL => "SOL".to_string(),
            crate::state::stablecoin::CollateralType::USDC => "USDC".to_string(),
            _ => "Unknown".to_string(),
        },
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// Event emitted when collateral is deposited
#[event]
pub struct CollateralDepositedEvent {
    pub stablecoin_config: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub collateral_type: String,
    pub timestamp: i64,
} 