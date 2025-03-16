use anchor_lang::prelude::*;

// User's collateral tracking account
#[account]
#[derive(Default)]
pub struct UserCollateral {
    pub owner: Pubkey,                 // User who owns this collateral
    pub stablecoin_config: Pubkey,     // The stablecoin this collateral backs
    pub collateral_amount: u64,        // Amount of collateral deposited
    pub collateral_type: CollateralType, // Type of collateral
    pub last_updated: i64,             // Last time record was updated
    pub bump: u8,
}

impl UserCollateral {
    pub fn space() -> usize {
        8 +                             // discriminator
        32 +                            // owner pubkey
        32 +                            // stablecoin_config pubkey
        8 +                             // collateral_amount
        1 + 32 +                        // variant discriminator + largest variant (Stablebond)
        8 +                             // last_updated
        1                               // bump
    }
}

// Enum to track the type of collateral used
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum CollateralType {
    #[default]
    None,
    Stablebond {
        bond_mint: Pubkey,
        bond_account: Pubkey,
    },
    SOL {
        deposit_account: Pubkey,
    },
    USDC {
        token_account: Pubkey,
    },
}

// Structure for storing Stablebond information fetched from Etherfuse
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct StablebondInfo {
    pub bond_mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub price: u64,
    pub maturity_time: i64,
    pub issuance_date: i64,
    pub annual_yield: u64,  // 100 = 1.00%
}

impl StablebondInfo {
    pub const MAX_NAME_LENGTH: usize = 32;
    pub const MAX_SYMBOL_LENGTH: usize = 10;
    
    pub fn space() -> usize {
        8 +                             // discriminator
        32 +                            // bond_mint pubkey
        4 + Self::MAX_NAME_LENGTH +     // name string
        4 + Self::MAX_SYMBOL_LENGTH +   // symbol string
        8 +                             // price
        8 +                             // maturity_time
        8 +                             // issuance_date
        8                               // annual_yield
    }
} 