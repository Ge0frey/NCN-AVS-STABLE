use anchor_lang::prelude::*;

declare_id!("AT9tsBfMFcNuTAfxTFnUZ54hKdcTuPvYPgSyb1rzQJ8G");

#[program]
pub mod blockchain_logic_stablefunds {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
