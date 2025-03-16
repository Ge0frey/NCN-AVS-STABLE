use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, MintTo, mint_to, Transfer, transfer},
    associated_token::{AssociatedToken, create},
};
use crate::{
    state::{StablecoinConfig, StablecoinCollateralType, UserStablecoin, StablecoinVault},
    errors::StablefundsError,
};

#[derive(Accounts)]
#[instruction(
    name: String,
    symbol: String,
    description: String,
    icon_index: u8,
    collateral_type: crate::state::stablecoin::CollateralType,
    collateralization_ratio: u64,
    initial_supply: u64,
    stablecoin_config_bump: u8,
    vault_bump: u8,
)]
pub struct CreateStablecoin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = StablecoinConfig::space(),
        seeds = [
            b"stablecoin-config",
            name.as_bytes(),
            symbol.as_bytes(),
            authority.key().as_ref(),
        ],
        bump,
    )]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = authority,
        space = StablecoinVault::space(),
        seeds = [
            b"stablecoin-vault",
            stablecoin_config.key().as_ref(),
        ],
        bump,
    )]
    pub stablecoin_vault: Account<'info, StablecoinVault>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = stablecoin_config,
    )]
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = stablecoin_mint,
        associated_token::authority = authority,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // When collateral is a Stablebond
    #[account(
        mut,
        constraint = 
            match collateral_type {
                crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                    bond_mint == stablebond_mint.key(),
                _ => true
            }
    )]
    pub stablebond_mint: Option<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = 
            match collateral_type {
                crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                    stablebond_token_account.mint == bond_mint &&
                    stablebond_token_account.owner == authority.key(),
                _ => true
            }
    )]
    pub stablebond_token_account: Option<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = 
            match collateral_type {
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

pub fn create_stablecoin(
    ctx: &mut Context<CreateStablecoin>,
    name: String,
    symbol: String,
    description: String,
    icon_index: u8,
    collateral_type: crate::state::StablecoinCollateralType,
    collateralization_ratio: u64,
    initial_supply: u64,
    stablecoin_config_bump: u8,
    vault_bump: u8,
) -> Result<()> {
    // Validate inputs
    if name.is_empty() || name.len() > StablecoinConfig::MAX_NAME_LENGTH {
        return Err(StablefundsError::InvalidStablecoinName.into());
    }

    if symbol.is_empty() || symbol.len() > StablecoinConfig::MAX_SYMBOL_LENGTH {
        return Err(StablefundsError::InvalidStablecoinSymbol.into());
    }

    if description.len() > StablecoinConfig::MAX_DESCRIPTION_LENGTH {
        return Err(StablefundsError::InvalidStablecoinDescription.into());
    }

    // Validate collateralization ratio (minimum 110%)
    if collateralization_ratio < 110 {
        return Err(StablefundsError::CollateralizationRatioTooLow.into());
    }

    // Validate icon index
    if icon_index > 10 {
        return Err(StablefundsError::InvalidIconIndex.into());
    }

    // Validate initial supply
    if initial_supply == 0 {
        return Err(StablefundsError::InvalidInitialSupply.into());
    }

    // Initialize stablecoin config account
    let stablecoin_config = &mut ctx.accounts.stablecoin_config;
    stablecoin_config.authority = ctx.accounts.authority.key();
    stablecoin_config.name = name;
    stablecoin_config.symbol = symbol;
    stablecoin_config.description = description;
    stablecoin_config.icon_index = icon_index;
    stablecoin_config.collateral_type = collateral_type.clone();
    stablecoin_config.collateralization_ratio = collateralization_ratio;
    stablecoin_config.mint = ctx.accounts.stablecoin_mint.key();
    stablecoin_config.total_supply = 0; // Will be updated after minting
    stablecoin_config.created_at = Clock::get()?.unix_timestamp;
    stablecoin_config.bump = stablecoin_config_bump;

    // Initialize vault
    let stablecoin_vault = &mut ctx.accounts.stablecoin_vault;
    stablecoin_vault.stablecoin_config = stablecoin_config.key();
    stablecoin_vault.authority = ctx.accounts.authority.key();
    stablecoin_vault.collateral_amount = 0; // Will be updated after collateral deposit
    stablecoin_vault.last_updated = Clock::get()?.unix_timestamp;
    stablecoin_vault.bump = vault_bump;

    // Process collateral transfer based on type
    match collateral_type {
        crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => {
            // Get required accounts for Stablebond collateral
            let stablebond_token_account = ctx.accounts.stablebond_token_account
                .as_ref()
                .ok_or(StablefundsError::InvalidStablebondMint)?;
                
            let vault_stablebond_token_account = ctx.accounts.vault_stablebond_token_account
                .as_ref()
                .ok_or(StablefundsError::InvalidStablebondMint)?;

            // Check that user has enough Stablebond tokens
            let required_collateral = calculate_required_collateral(
                initial_supply,
                collateralization_ratio,
                1_000_000, // Assume 1:1 value for now, in a real app we'd query the price
            );

            if stablebond_token_account.amount < required_collateral {
                return Err(StablefundsError::InsufficientStablebondTokens.into());
            }

            // Transfer Stablebond tokens from user to vault
            let cpi_accounts = Transfer {
                from: stablebond_token_account.to_account_info(),
                to: vault_stablebond_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            
            transfer(cpi_ctx, required_collateral)?;

            // Update vault collateral amount
            stablecoin_vault.collateral_amount = required_collateral;
        },
        _ => {
            // For now, only implement Stablebond collateral
            return Err(StablefundsError::UnsupportedCollateralType.into());
        }
    }

    // Mint initial supply to user
    let seeds = [
        b"stablecoin-config",
        ctx.accounts.stablecoin_config.name.as_bytes(),
        ctx.accounts.stablecoin_config.symbol.as_bytes(),
        ctx.accounts.stablecoin_config.authority.as_ref(),
        &[ctx.accounts.stablecoin_config.bump],
    ];

    let signer = &[&seeds[..]];
    
    let cpi_accounts = MintTo {
        mint: ctx.accounts.stablecoin_mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.stablecoin_config.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    mint_to(cpi_ctx, initial_supply)?;

    // Update stablecoin config total supply
    let stablecoin_config = &mut ctx.accounts.stablecoin_config;
    stablecoin_config.total_supply = initial_supply;

    // Emit successful creation event
    emit!(StablecoinCreatedEvent {
        stablecoin_config: stablecoin_config.key(),
        authority: ctx.accounts.authority.key(),
        mint: ctx.accounts.stablecoin_mint.key(),
        name: stablecoin_config.name.clone(),
        symbol: stablecoin_config.symbol.clone(),
        collateral_type: match stablecoin_config.collateral_type {
            crate::state::stablecoin::CollateralType::Stablebond { bond_mint } => 
                format!("Stablebond: {}", bond_mint),
            crate::state::stablecoin::CollateralType::SOL => "SOL".to_string(),
            crate::state::stablecoin::CollateralType::USDC => "USDC".to_string(),
            _ => "Unknown".to_string(),
        },
        initial_supply,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// Calculate required collateral based on desired stablecoin amount
fn calculate_required_collateral(
    stablecoin_amount: u64,
    collateralization_ratio: u64,
    collateral_price: u64,
) -> u64 {
    // Formula: stablecoin_amount * collateralization_ratio / 100 / collateral_price
    stablecoin_amount
        .checked_mul(collateralization_ratio)
        .unwrap()
        .checked_div(100)
        .unwrap()
        .checked_mul(1_000_000) // Scale by 10^6 for decimal precision
        .unwrap()
        .checked_div(collateral_price)
        .unwrap()
}

// Event emitted when a stablecoin is created
#[event]
pub struct StablecoinCreatedEvent {
    pub stablecoin_config: Pubkey,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub collateral_type: String,
    pub initial_supply: u64,
    pub timestamp: i64,
} 