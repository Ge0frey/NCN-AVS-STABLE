use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SmartVaultParams {
    pub name: String,
    pub risk_level: u8, // 1-5, with 1 being the lowest risk
    pub auto_compound: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StrategyAllocation {
    pub strategy_id: u8,
    pub allocation_percentage: u8, // 0-100
}

#[account]
pub struct SmartVault {
    pub owner: Pubkey,
    pub collateral_mint: Pubkey,
    pub vault_token_account: Pubkey,
    pub total_deposited: u64,
    pub total_allocated: u64,
    pub risk_level: u8,
    pub auto_compound: bool,
    pub name: String,
    pub strategies: Vec<StrategyAllocation>,
    pub active: bool,
    pub last_update_time: i64,
    pub total_yield_earned: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeSmartVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub collateral_mint: Account<'info, token::Mint>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 1 + 32 + 32 + 1 + 8 + 8 + 1, // Adjust space as needed
        seeds = [b"smart-vault", owner.key().as_ref(), collateral_mint.key().as_ref()],
        bump
    )]
    pub smart_vault: Account<'info, SmartVault>,
    
    #[account(
        init,
        payer = owner,
        token::mint = collateral_mint,
        token::authority = smart_vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositToStrategy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"smart-vault", owner.key().as_ref(), smart_vault.collateral_mint.as_ref()],
        bump = smart_vault.bump,
        has_one = owner,
        constraint = smart_vault.active == true
    )]
    pub smart_vault: Account<'info, SmartVault>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == smart_vault.collateral_mint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = vault_token_account.key() == smart_vault.vault_token_account
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFromStrategy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"smart-vault", owner.key().as_ref(), smart_vault.collateral_mint.as_ref()],
        bump = smart_vault.bump,
        has_one = owner,
        constraint = smart_vault.active == true
    )]
    pub smart_vault: Account<'info, SmartVault>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == smart_vault.collateral_mint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = vault_token_account.key() == smart_vault.vault_token_account
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateStrategyAllocation<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"smart-vault", owner.key().as_ref(), smart_vault.collateral_mint.as_ref()],
        bump = smart_vault.bump,
        has_one = owner,
        constraint = smart_vault.active == true
    )]
    pub smart_vault: Account<'info, SmartVault>,
}

// Implementation of functions
pub fn initialize_smart_vault(ctx: Context<InitializeSmartVault>, vault_params: SmartVaultParams) -> Result<()> {
    let smart_vault = &mut ctx.accounts.smart_vault;
    let bump = *ctx.bumps.get("smart_vault").unwrap();
    
    smart_vault.owner = ctx.accounts.owner.key();
    smart_vault.collateral_mint = ctx.accounts.collateral_mint.key();
    smart_vault.vault_token_account = ctx.accounts.vault_token_account.key();
    smart_vault.total_deposited = 0;
    smart_vault.total_allocated = 0;
    smart_vault.risk_level = vault_params.risk_level;
    smart_vault.auto_compound = vault_params.auto_compound;
    smart_vault.name = vault_params.name;
    smart_vault.strategies = Vec::new();
    smart_vault.active = true;
    smart_vault.last_update_time = Clock::get()?.unix_timestamp;
    smart_vault.total_yield_earned = 0;
    smart_vault.bump = bump;
    
    Ok(())
}

pub fn deposit_to_strategy(ctx: Context<DepositToStrategy>, amount: u64) -> Result<()> {
    // Transfer tokens from user to vault
    let transfer_instruction = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        ),
        amount,
    )?;
    
    // Update smart vault state
    let smart_vault = &mut ctx.accounts.smart_vault;
    smart_vault.total_deposited = smart_vault.total_deposited.checked_add(amount).unwrap();
    smart_vault.last_update_time = Clock::get()?.unix_timestamp;
    
    // Here we would allocate to strategies based on risk level and strategy allocations
    // For demo purposes, we're just tracking the deposit
    
    Ok(())
}

pub fn withdraw_from_strategy(ctx: Context<WithdrawFromStrategy>, amount: u64) -> Result<()> {
    let smart_vault = &mut ctx.accounts.smart_vault;
    require!(amount <= ctx.accounts.vault_token_account.amount, ErrorCode::InsufficientFunds);
    
    // Calculate vault signer seeds
    let seeds = &[
        b"smart-vault",
        ctx.accounts.owner.key.as_ref(),
        smart_vault.collateral_mint.as_ref(),
        &[smart_vault.bump],
    ];
    let signer = &[&seeds[..]];
    
    // Transfer tokens from vault to user
    let transfer_instruction = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.owner_token_account.to_account_info(),
        authority: smart_vault.to_account_info(),
    };
    
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            signer,
        ),
        amount,
    )?;
    
    // Update smart vault state
    smart_vault.total_deposited = smart_vault.total_deposited.checked_sub(amount).unwrap();
    smart_vault.last_update_time = Clock::get()?.unix_timestamp;
    
    Ok(())
}

pub fn update_strategy_allocation(ctx: Context<UpdateStrategyAllocation>, allocations: Vec<StrategyAllocation>) -> Result<()> {
    let smart_vault = &mut ctx.accounts.smart_vault;
    
    // Validate total allocation is 100%
    let total_allocation: u8 = allocations.iter().map(|a| a.allocation_percentage).sum();
    require!(total_allocation == 100, ErrorCode::InvalidAllocation);
    
    // Update strategy allocations
    smart_vault.strategies = allocations;
    smart_vault.last_update_time = Clock::get()?.unix_timestamp;
    
    // Here we would rebalance across strategies based on new allocations
    // For demo purposes, we're just updating the allocations
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds for transaction")]
    InsufficientFunds,
    #[msg("Invalid allocation percentages, must total 100%")]
    InvalidAllocation,
} 