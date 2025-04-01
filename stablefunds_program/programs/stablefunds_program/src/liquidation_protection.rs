use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// Protection configuration parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ProtectionConfig {
    pub threshold_percentage: u8,       // Health ratio threshold % (e.g., 120 = 120%)
    pub protection_mode: u8,            // 1 = Auto-repay, 2 = Add collateral, 3 = Both
    pub max_protection_amount: u64,     // Maximum amount for auto-protection
    pub notification_only: bool,        // True if notification only (no auto-protection)
    pub cooldown_period: i64,           // Time between protection actions in seconds
    pub auto_collateral_source: Pubkey, // Token account to source auto-collateral from
}

// Represents a configured protection for a collateral position
#[account]
pub struct ProtectionAccount {
    pub owner: Pubkey,                   // Owner of the protected position
    pub stablecoin_mint: Pubkey,         // The stablecoin being protected
    pub collateral_mint: Pubkey,         // The collateral being protected
    pub config: ProtectionConfig,        // Protection configuration
    pub is_active: bool,                 // Whether protection is active
    pub last_protection_time: i64,       // Last time protection was triggered
    pub total_protection_actions: u64,   // Total number of protection actions
    pub total_protected_amount: u64,     // Total amount protected
    pub last_health_ratio: u16,          // Last recorded health ratio (scaled by 100)
    pub bump: u8,                        // PDA bump
}

// Protection action history record 
#[account]
pub struct ProtectionActionRecord {
    pub protection_account: Pubkey,     // The protection account
    pub timestamp: i64,                 // When the action occurred
    pub action_type: u8,                // 1 = Auto-repay, 2 = Add collateral
    pub amount: u64,                    // Amount involved in the action
    pub health_ratio_before: u16,       // Health ratio before protection (scaled by 100)
    pub health_ratio_after: u16,        // Health ratio after protection (scaled by 100)
    pub success: bool,                  // Whether the protection succeeded
    pub bump: u8,                       // PDA bump
}

#[derive(Accounts)]
pub struct ConfigureProtection<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub stablecoin_mint: Account<'info, token::Mint>,
    
    pub collateral_mint: Account<'info, token::Mint>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + 32 + 32 + 32 + 1 + 8 + 1 + 1 + 32 + 1 + 8 + 8 + 8 + 2 + 1, // Adjust as needed
        seeds = [b"protection", owner.key().as_ref(), stablecoin_mint.key().as_ref(), collateral_mint.key().as_ref()],
        bump,
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    
    #[account(
        constraint = auto_collateral_source.owner == owner.key(),
        constraint = auto_collateral_source.mint == collateral_mint.key()
    )]
    pub auto_collateral_source: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ActivateProtection<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"protection", owner.key().as_ref(), protection_account.stablecoin_mint.as_ref(), protection_account.collateral_mint.as_ref()],
        bump = protection_account.bump,
        has_one = owner
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
}

#[derive(Accounts)]
pub struct DeactivateProtection<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"protection", owner.key().as_ref(), protection_account.stablecoin_mint.as_ref(), protection_account.collateral_mint.as_ref()],
        bump = protection_account.bump,
        has_one = owner
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
}

#[derive(Accounts)]
pub struct ExecuteProtectionAction<'info> {
    // Can be owner or a protection service with delegated authority
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"protection", protection_account.owner.as_ref(), protection_account.stablecoin_mint.as_ref(), protection_account.collateral_mint.as_ref()],
        bump = protection_account.bump,
        constraint = protection_account.is_active == true
    )]
    pub protection_account: Account<'info, ProtectionAccount>,
    
    #[account(
        mut,
        constraint = source_token_account.mint == protection_account.collateral_mint,
        constraint = source_token_account.owner == authority.key() || source_token_account.key() == protection_account.config.auto_collateral_source
    )]
    pub source_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        // In a real implementation, this would be the vault or position token account
        constraint = destination_token_account.mint == protection_account.collateral_mint
    )]
    pub destination_token_account: Account<'info, TokenAccount>,
    
    // Record of this protection action
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 1 + 8 + 2 + 2 + 1 + 1,
        seeds = [b"protection-action", protection_account.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub action_record: Account<'info, ProtectionActionRecord>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

// Implementation of the functions

pub fn configure_protection(ctx: Context<ConfigureProtection>, config: ProtectionConfig) -> Result<()> {
    let protection_account = &mut ctx.accounts.protection_account;
    
    // Validate config parameters
    require!(config.threshold_percentage > 100, ErrorCode::InvalidThreshold);
    require!(config.protection_mode > 0 && config.protection_mode <= 3, ErrorCode::InvalidProtectionMode);
    
    // Initialize or update protection account
    if protection_account.owner == Pubkey::default() {
        protection_account.owner = ctx.accounts.owner.key();
        protection_account.stablecoin_mint = ctx.accounts.stablecoin_mint.key();
        protection_account.collateral_mint = ctx.accounts.collateral_mint.key();
        protection_account.is_active = false;
        protection_account.last_protection_time = 0;
        protection_account.total_protection_actions = 0;
        protection_account.total_protected_amount = 0;
        protection_account.last_health_ratio = 0;
        // Set a fixed bump value for now until we resolve the build issues
        protection_account.bump = 255;
    }
    
    // Update config
    protection_account.config = config;
    
    Ok(())
}

pub fn activate_protection(ctx: Context<ActivateProtection>) -> Result<()> {
    let protection_account = &mut ctx.accounts.protection_account;
    
    protection_account.is_active = true;
    protection_account.last_health_ratio = get_current_health_ratio()?; // Mock function
    
    Ok(())
}

pub fn deactivate_protection(ctx: Context<DeactivateProtection>) -> Result<()> {
    let protection_account = &mut ctx.accounts.protection_account;
    
    protection_account.is_active = false;
    
    Ok(())
}

pub fn execute_protection_action(ctx: Context<ExecuteProtectionAction>, action_type: u8) -> Result<()> {
    let protection_account = &mut ctx.accounts.protection_account;
    let action_record = &mut ctx.accounts.action_record;
    let current_time = Clock::get()?.unix_timestamp;
    
    // Verify cooldown period
    require!(
        current_time - protection_account.last_protection_time >= protection_account.config.cooldown_period,
        ErrorCode::CooldownPeriodActive
    );
    
    // Get current health ratio
    let current_health_ratio = get_current_health_ratio()?;
    
    // Check if protection is needed
    require!(
        current_health_ratio < protection_account.config.threshold_percentage as u16,
        ErrorCode::ProtectionNotNeeded
    );
    
    // Verify action type matches configured mode
    match action_type {
        1 => require!(
            protection_account.config.protection_mode == 1 || protection_account.config.protection_mode == 3,
            ErrorCode::ActionTypeNotAllowed
        ),
        2 => require!(
            protection_account.config.protection_mode == 2 || protection_account.config.protection_mode == 3,
            ErrorCode::ActionTypeNotAllowed
        ),
        _ => return Err(ErrorCode::InvalidActionType.into()),
    }
    
    // Skip actual protection if notification_only is true
    if protection_account.config.notification_only {
        // Just record the action without executing
        // Set a fixed bump value for now
        let action_bump = 255;
        
        record_protection_action(
            action_record,
            protection_account.key(),
            current_time,
            action_type,
            0,
            current_health_ratio,
            current_health_ratio,
            false,
            action_bump,
        )?;
        
        return Ok(());
    }
    
    // Calculate amount needed for protection
    let protection_amount = calculate_protection_amount(current_health_ratio, protection_account.config.threshold_percentage)?;
    
    // Limit to max protection amount
    let protection_amount = std::cmp::min(protection_amount, protection_account.config.max_protection_amount);
    
    // Check if source has enough funds
    require!(
        ctx.accounts.source_token_account.amount >= protection_amount,
        ErrorCode::InsufficientFunds
    );
    
    // Execute the transfer - using token::transfer to add funds
    if action_type == 2 { // Add collateral
        // Transfer tokens from source to destination (typically the collateral position)
        let transfer_instruction = Transfer {
            from: ctx.accounts.source_token_account.to_account_info(),
            to: ctx.accounts.destination_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            ),
            protection_amount,
        )?;
    }
    
    // For action_type == 1 (Auto-repay), we would implement repayment logic here
    // This is intentionally simplified for this demo
    
    // Calculate new health ratio after protection
    let new_health_ratio = calculate_new_health_ratio(current_health_ratio, protection_amount)?;
    
    // Update protection account
    protection_account.last_protection_time = current_time;
    protection_account.total_protection_actions += 1;
    protection_account.total_protected_amount = protection_account.total_protected_amount.checked_add(protection_amount).unwrap();
    protection_account.last_health_ratio = new_health_ratio;
    
    // Record the action
    // Set a fixed bump value for now
    let action_bump = 255;
    
    record_protection_action(
        action_record,
        protection_account.key(),
        current_time,
        action_type,
        protection_amount,
        current_health_ratio,
        new_health_ratio,
        true,
        action_bump,
    )?;
    
    Ok(())
}

// Helper functions

fn record_protection_action(
    action_record: &mut ProtectionActionRecord,
    protection_account: Pubkey,
    timestamp: i64,
    action_type: u8,
    amount: u64,
    health_ratio_before: u16,
    health_ratio_after: u16,
    success: bool,
    bump: u8,
) -> Result<()> {
    action_record.protection_account = protection_account;
    action_record.timestamp = timestamp;
    action_record.action_type = action_type;
    action_record.amount = amount;
    action_record.health_ratio_before = health_ratio_before;
    action_record.health_ratio_after = health_ratio_after;
    action_record.success = success;
    action_record.bump = bump;
    
    Ok(())
}

// In a real implementation, these would interact with oracle price feeds and position data
// For demo purposes, these are simplified mock implementations

// Gets the current health ratio from the oracle/position
fn get_current_health_ratio() -> Result<u16> {
    // Mock implementation - would retrieve from oracle in real implementation
    // Returns random health ratio between 105-125% for demo purposes
    let mock_health_ratio = 110u16;
    Ok(mock_health_ratio)
}

// Calculates amount needed to restore health ratio
fn calculate_protection_amount(current_ratio: u16, target_ratio: u8) -> Result<u64> {
    // Mock implementation - in reality would be based on position size and prices
    // For demo, assume 1 SOL (~$100) per 10% health ratio improvement needed
    let ratio_diff = target_ratio as u16 - current_ratio;
    let sol_needed = (ratio_diff as u64 + 9) / 10; // Ceiling division
    let lamports_needed = sol_needed * 1_000_000_000; // SOL to lamports
    
    Ok(lamports_needed)
}

// Calculates new health ratio after protection action
fn calculate_new_health_ratio(current_ratio: u16, _protection_amount: u64) -> Result<u16> {
    // Mock implementation - in reality would recalculate based on new position value
    // For demo, assume each SOL adds 10% to health ratio
    let sol_amount = _protection_amount / 1_000_000_000;
    let new_ratio = current_ratio + (sol_amount * 10) as u16;
    
    Ok(new_ratio)
}

#[error_code]
pub enum ErrorCode {
    #[msg("Health ratio threshold must be greater than 100%")]
    InvalidThreshold,
    #[msg("Invalid protection mode")]
    InvalidProtectionMode,
    #[msg("Cooldown period is still active")]
    CooldownPeriodActive,
    #[msg("Protection not needed, health ratio above threshold")]
    ProtectionNotNeeded,
    #[msg("Insufficient funds for protection action")]
    InsufficientFunds,
    #[msg("Invalid protection action type")]
    InvalidActionType,
    #[msg("Action type not allowed by current protection mode")]
    ActionTypeNotAllowed,
} 