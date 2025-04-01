use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use std::mem::size_of;

declare_id!("97XJBATGaXqBSVRQYszL7pr4RP46Uv9KH6FzcLx3zgd8");

pub mod smart_vaults;
pub mod liquidation_protection;

#[program]
pub mod stablefunds_program {
    use super::*;

    pub fn create_stablecoin(
        ctx: Context<CreateStablecoin>,
        name: String,
        symbol: String,
        description: String,
        icon_index: u8,
        collateral_type: CollateralType,
        collateralization_ratio: u64, // In basis points (e.g., 15000 = 150%)
        initial_supply: u64,          // In smallest units (e.g., lamports)
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        let authority = &ctx.accounts.authority;
        let clock = Clock::get()?;

        // Initialize the stablecoin config
        stablecoin_config.authority = authority.key();
        stablecoin_config.name = name;
        stablecoin_config.symbol = symbol.clone();
        stablecoin_config.description = description;
        stablecoin_config.icon_index = icon_index;
        stablecoin_config.collateral_type = collateral_type;
        stablecoin_config.collateralization_ratio = collateralization_ratio;
        stablecoin_config.mint = ctx.accounts.stablecoin_mint.key();
        stablecoin_config.total_supply = initial_supply;
        stablecoin_config.created_at = clock.unix_timestamp;

        // Mint the initial supply to the user
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.stablecoin_mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.stablecoin_mint.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, initial_supply)?;

        msg!("Stablecoin created: {}", symbol);
        Ok(())
    }

    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        amount: u64,
    ) -> Result<()> {
        let stablecoin_config = &ctx.accounts.stablecoin_config;
        let user = &ctx.accounts.user;
        let user_collateral = &mut ctx.accounts.user_collateral;

        // Initialize user collateral account if it's new
        if user_collateral.amount == 0 {
            user_collateral.user = user.key();
            user_collateral.stablecoin_config = stablecoin_config.key();
        }

        // Update user collateral amount
        user_collateral.amount = user_collateral.amount.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        msg!("Collateral deposited: {}", amount);
        Ok(())
    }

    pub fn mint_stablecoin(
        ctx: Context<MintStablecoin>,
        amount: u64,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        let user = &ctx.accounts.user;
        let user_stablecoin = &mut ctx.accounts.user_stablecoin;

        // Initialize user stablecoin account if it's new
        if user_stablecoin.amount == 0 {
            user_stablecoin.user = user.key();
            user_stablecoin.stablecoin_config = stablecoin_config.key();
        }

        // Mint the stablecoins to the user
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.stablecoin_mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.stablecoin_mint.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        // Update user stablecoin amount and total supply
        user_stablecoin.amount = user_stablecoin.amount.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        stablecoin_config.total_supply = stablecoin_config.total_supply.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        msg!("Stablecoin minted: {}", amount);
        Ok(())
    }

    // Smart Vaults functions
    pub fn initialize_smart_vault(ctx: Context<InitializeSmartVault>, vault_params: SmartVaultParams) -> Result<()> {
        smart_vaults::initialize_smart_vault(ctx, vault_params)
    }

    pub fn deposit_to_strategy(ctx: Context<DepositToStrategy>, amount: u64) -> Result<()> {
        smart_vaults::deposit_to_strategy(ctx, amount)
    }

    pub fn withdraw_from_strategy(ctx: Context<WithdrawFromStrategy>, amount: u64) -> Result<()> {
        smart_vaults::withdraw_from_strategy(ctx, amount)
    }

    pub fn update_strategy_allocation(ctx: Context<UpdateStrategyAllocation>, allocations: Vec<StrategyAllocation>) -> Result<()> {
        smart_vaults::update_strategy_allocation(ctx, allocations)
    }

    // Liquidation Protection System functions
    pub fn configure_protection(ctx: Context<ConfigureProtection>, config: ProtectionConfig) -> Result<()> {
        liquidation_protection::configure_protection(ctx, config)
    }

    pub fn activate_protection(ctx: Context<ActivateProtection>) -> Result<()> {
        liquidation_protection::activate_protection(ctx)
    }

    pub fn deactivate_protection(ctx: Context<DeactivateProtection>) -> Result<()> {
        liquidation_protection::deactivate_protection(ctx)
    }

    pub fn execute_protection_action(ctx: Context<ExecuteProtectionAction>, action_type: u8) -> Result<()> {
        liquidation_protection::execute_protection_action(ctx, action_type)
    }
}

#[derive(Accounts)]
#[instruction(
    name: String,
    symbol: String,
    description: String,
    icon_index: u8,
    collateral_type: CollateralType,
    collateralization_ratio: u64,
    initial_supply: u64,
)]
pub struct CreateStablecoin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = StablecoinConfig::space(&name, &symbol, &description),
        seeds = [
            b"stablecoin-config",
            name.as_bytes(),
            symbol.as_bytes(),
            authority.key().as_ref()
        ],
        bump
    )]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        seeds = [
            b"stablecoin-vault",
            stablecoin_config.key().as_ref()
        ],
        bump
    )]
    /// CHECK: This is a PDA that will hold SOL
    pub stablecoin_vault: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = stablecoin_mint,
    )]
    pub stablecoin_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = stablecoin_mint,
        associated_token::authority = authority
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    /// Optional accounts for Stablebond collateral
    pub stablebond_mint: Option<Box<Account<'info, Mint>>>,
    pub stablebond_token_account: Option<Box<Account<'info, TokenAccount>>>,
    pub vault_stablebond_token_account: Option<Box<Account<'info, TokenAccount>>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        seeds = [
            b"stablecoin-vault",
            stablecoin_config.key().as_ref()
        ],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub stablecoin_vault: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + size_of::<UserCollateral>(),
        seeds = [
            b"user-collateral",
            user.key().as_ref(),
            stablecoin_config.key().as_ref()
        ],
        bump
    )]
    pub user_collateral: Account<'info, UserCollateral>,

    /// Optional accounts for Stablebond collateral
    pub stablebond_mint: Option<Box<Account<'info, Mint>>>,
    pub user_stablebond_token_account: Option<Box<Account<'info, TokenAccount>>>,
    pub vault_stablebond_token_account: Option<Box<Account<'info, TokenAccount>>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintStablecoin<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        seeds = [
            b"stablecoin-vault",
            stablecoin_config.key().as_ref()
        ],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub stablecoin_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub stablecoin_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = stablecoin_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + size_of::<UserStablecoin>(),
        seeds = [
            b"user-stablecoin",
            user.key().as_ref(),
            stablecoin_config.key().as_ref()
        ],
        bump
    )]
    pub user_stablecoin: Account<'info, UserStablecoin>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct StablecoinConfig {
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub icon_index: u8,
    pub collateral_type: CollateralType,
    pub collateralization_ratio: u64, // In basis points (e.g., 15000 = 150%)
    pub mint: Pubkey,
    pub total_supply: u64,
    pub created_at: i64,
}

impl StablecoinConfig {
    pub fn space(name: &str, symbol: &str, description: &str) -> usize {
        8 + // discriminator
        32 + // authority
        4 + name.len() + // name
        4 + symbol.len() + // symbol
        4 + description.len() + // description
        1 + // icon_index
        1 + // collateral_type
        8 + // collateralization_ratio
        32 + // mint
        8 + // total_supply
        8 // created_at
    }
}

#[account]
pub struct UserCollateral {
    pub user: Pubkey,
    pub stablecoin_config: Pubkey,
    pub amount: u64,
}

#[account]
pub struct UserStablecoin {
    pub user: Pubkey,
    pub stablecoin_config: Pubkey,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CollateralType {
    Sol,
    Stablebond,
    Usdc,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
