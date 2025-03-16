use anchor_lang::prelude::*;

#[error_code]
pub enum StablefundsError {
    #[msg("The stablecoin name is invalid or too long")]
    InvalidStablecoinName,

    #[msg("The stablecoin symbol is invalid or too long")]
    InvalidStablecoinSymbol,

    #[msg("The stablecoin description is too long")]
    InvalidStablecoinDescription,

    #[msg("The collateralization ratio is below the minimum required")]
    CollateralizationRatioTooLow,

    #[msg("The collateral amount is insufficient for the requested stablecoin amount")]
    InsufficientCollateral,

    #[msg("The stablebond mint does not match the expected data")]
    InvalidStablebondMint,

    #[msg("The stablebond has not reached maturity")]
    StablebondNotMatured,

    #[msg("The stablebond token account does not have enough tokens")]
    InsufficientStablebondTokens,

    #[msg("The provided collateral type is not supported")]
    UnsupportedCollateralType,

    #[msg("The token account owner does not match the expected signer")]
    InvalidTokenAccountOwner,

    #[msg("The mint authority does not match the expected program address")]
    InvalidMintAuthority,

    #[msg("The stablecoin configuration is not in a valid state")]
    InvalidStablecoinState,

    #[msg("The stablebond fetch request failed")]
    StablebondFetchFailed,

    #[msg("Not enough tokens to perform this operation")]
    InsufficientTokens,

    #[msg("The provided icon index is invalid")]
    InvalidIconIndex,

    #[msg("The provided collateral type is invalid")]
    InvalidCollateralType,

    #[msg("The initial supply must be greater than zero")]
    InvalidInitialSupply,

    #[msg("Operation not permitted by the authority")]
    UnauthorizedOperation,
} 