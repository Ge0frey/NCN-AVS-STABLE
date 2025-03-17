use anchor_lang::prelude::*;

declare_id!("36Pd9Lzj64MpvJyw5kNyv54xqddeYc1fanat5zrTyWpn");

#[program]
pub mod stablefunds {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
