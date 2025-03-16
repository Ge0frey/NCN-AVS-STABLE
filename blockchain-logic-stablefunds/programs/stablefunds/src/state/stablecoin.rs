use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[account]
#[derive(Default)]
pub struct StablecoinConfig {
    pub authority: Pubkey,            // Creator of the stablecoin
    pub name: String,                 // Max 32 chars
    pub symbol: String,               // Max 10 chars
    pub description: String,          // Max 200 chars
    pub icon_index: u8,               // Reference to predefined icons
    pub collateral_type: CollateralType,
    pub collateralization_ratio: u64, // 100 = 1.00x
    pub mint: Pubkey,                 // SPL Token mint address
    pub total_supply: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl StablecoinConfig {
    pub const MAX_NAME_LENGTH: usize = 32;
    pub const MAX_SYMBOL_LENGTH: usize = 10;
    pub const MAX_DESCRIPTION_LENGTH: usize = 200;
    
    pub fn space() -> usize {
        8 +                             // discriminator
        32 +                            // authority pubkey
        4 + Self::MAX_NAME_LENGTH +     // name string
        4 + Self::MAX_SYMBOL_LENGTH +   // symbol string
        4 + Self::MAX_DESCRIPTION_LENGTH + // description string
        1 +                             // icon_index
        1 + 32 +                        // variant discriminator + largest variant (Stablebond)
        8 +                             // collateralization_ratio
        32 +                            // mint pubkey
        8 +                             // total_supply
        8 +                             // created_at
        1                               // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum CollateralType {
    #[default]
    None,
    Stablebond {
        bond_mint: Pubkey
    },
    SOL,
    USDC,
}

// The stablecoin vault PDA - holds the backing collateral
#[account]
#[derive(Default)]
pub struct StablecoinVault {
    pub stablecoin_config: Pubkey,    // The stablecoin this vault is for
    pub authority: Pubkey,            // Creator/owner of the stablecoin
    pub collateral_amount: u64,       // Amount of collateral deposited
    pub last_updated: i64,            // Last time vault was updated
    pub bump: u8,
}

impl StablecoinVault {
    pub fn space() -> usize {
        8 +                             // discriminator
        32 +                            // stablecoin_config pubkey
        32 +                            // authority pubkey
        8 +                             // collateral_amount
        8 +                             // last_updated
        1                               // bump
    }
}

// Metadata about a user's stablecoin
#[account]
#[derive(Default)]
pub struct UserStablecoin {
    pub owner: Pubkey,                 // Owner of the stablecoin
    pub stablecoin_config: Pubkey,     // The stablecoin configuration
    pub token_account: Pubkey,         // User's token account for this stablecoin
    pub amount: u64,                   // Amount of stablecoin tokens held
    pub last_updated: i64,             // Last time record was updated
    pub bump: u8,
}

impl UserStablecoin {
    pub fn space() -> usize {
        8 +                             // discriminator
        32 +                            // owner pubkey
        32 +                            // stablecoin_config pubkey
        32 +                            // token_account pubkey
        8 +                             // amount
        8 +                             // last_updated
        1                               // bump
    }
} 