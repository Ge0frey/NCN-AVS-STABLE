use anchor_lang::prelude::*;
use crate::{
    state::StablebondInfo,
    errors::StablefundsError,
};

#[derive(Accounts)]
pub struct FetchStablebonds<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: This is a PDA that will store the fetched stablebond info
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 4 + (StablebondInfo::space() * 10), // Support up to 10 stablebonds
        seeds = [b"stablebond-list", user.key().as_ref()],
        bump
    )]
    pub stablebond_list: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

// This is a simplified version that would be replaced with actual Etherfuse SDK integration
pub fn fetch_stablebonds(ctx: &mut Context<FetchStablebonds>) -> Result<()> {
    // In a real implementation, this would call out to the Etherfuse SDK
    // to fetch available stablebonds. For now, we'll create some mock data.
    
    // Create mock stablebond data
    let mock_stablebonds = vec![
        StablebondInfo {
            bond_mint: Pubkey::new_unique(),
            name: "US Treasury 1Y".to_string(),
            symbol: "UST1Y".to_string(),
            price: 1_000_000, // $1.00 with 6 decimals
            maturity_time: Clock::get()?.unix_timestamp + 31_536_000, // 1 year from now
            issuance_date: Clock::get()?.unix_timestamp,
            annual_yield: 450, // 4.50%
        },
        StablebondInfo {
            bond_mint: Pubkey::new_unique(),
            name: "US Treasury 2Y".to_string(),
            symbol: "UST2Y".to_string(),
            price: 1_000_000, // $1.00 with 6 decimals
            maturity_time: Clock::get()?.unix_timestamp + 63_072_000, // 2 years from now
            issuance_date: Clock::get()?.unix_timestamp,
            annual_yield: 480, // 4.80%
        },
        StablebondInfo {
            bond_mint: Pubkey::new_unique(),
            name: "US Treasury 5Y".to_string(),
            symbol: "UST5Y".to_string(),
            price: 1_000_000, // $1.00 with 6 decimals
            maturity_time: Clock::get()?.unix_timestamp + 157_680_000, // 5 years from now
            issuance_date: Clock::get()?.unix_timestamp,
            annual_yield: 520, // 5.20%
        },
    ];
    
    // Serialize the stablebond list to the account
    let mut data = ctx.accounts.stablebond_list.try_borrow_mut_data()?;
    
    // Write the number of stablebonds
    let stablebond_count = mock_stablebonds.len() as u32;
    data[0..4].copy_from_slice(&stablebond_count.to_le_bytes());
    
    // Write each stablebond
    let mut offset = 4;
    for stablebond in mock_stablebonds {
        let serialized = stablebond.try_to_vec()?;
        let end = offset + serialized.len();
        
        if end > data.len() {
            return Err(StablefundsError::StablebondFetchFailed.into());
        }
        
        data[offset..end].copy_from_slice(&serialized);
        offset = end;
    }
    
    // Emit event for successful fetch
    emit!(StablebondsFetchedEvent {
        user: ctx.accounts.user.key(),
        count: stablebond_count,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

// Event emitted when stablebonds are fetched
#[event]
pub struct StablebondsFetchedEvent {
    pub user: Pubkey,
    pub count: u32,
    pub timestamp: i64,
}

// In a real implementation, we would add a helper function to parse the stablebond list
pub fn parse_stablebond_list(data: &[u8]) -> Result<Vec<StablebondInfo>> {
    if data.len() < 4 {
        return Err(StablefundsError::StablebondFetchFailed.into());
    }
    
    let count_bytes = &data[0..4];
    let count = u32::from_le_bytes([count_bytes[0], count_bytes[1], count_bytes[2], count_bytes[3]]);
    
    let mut stablebonds = Vec::with_capacity(count as usize);
    let mut offset = 4;
    
    for _ in 0..count {
        let stablebond = StablebondInfo::try_from_slice(&data[offset..])?;
        let serialized_len = stablebond.try_to_vec()?.len();
        offset += serialized_len;
        stablebonds.push(stablebond);
    }
    
    Ok(stablebonds)
} 