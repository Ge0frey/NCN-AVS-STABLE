use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;
use state::{StablecoinCollateralType, UserCollateralType};
use errors::*;

declare_id!("97XJBATGaXqBSVRQYszL7pr4RP46Uv9KH6FzcLx3zgd8");

#[program]
pub mod stablefunds {
    use super::*;

    // Create a new stablecoin with the specified parameters
    pub fn create_stablecoin(
        mut ctx: Context<CreateStablecoin>,
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
        instructions::create_stablecoin(
            &mut ctx,
            name,
            symbol,
            description,
            icon_index,
            collateral_type,
            collateralization_ratio,
            initial_supply,
            stablecoin_config_bump,
            vault_bump,
        )
    }

    // Deposit additional collateral for an existing stablecoin
    pub fn deposit_collateral(
        mut ctx: Context<DepositCollateral>,
        amount: u64,
        user_collateral_bump: u8,
    ) -> Result<()> {
        instructions::deposit_collateral(&mut ctx, amount, user_collateral_bump)
    }

    // Mint additional stablecoin tokens based on available collateral
    pub fn mint_stablecoin(
        mut ctx: Context<MintStablecoin>,
        amount: u64,
        user_stablecoin_bump: u8,
    ) -> Result<()> {
        instructions::mint_stablecoin(&mut ctx, amount, user_stablecoin_bump)
    }

    // Fetch available stablebonds from Etherfuse
    pub fn fetch_stablebonds(mut ctx: Context<FetchStablebonds>) -> Result<()> {
        instructions::fetch_stablebonds(&mut ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
