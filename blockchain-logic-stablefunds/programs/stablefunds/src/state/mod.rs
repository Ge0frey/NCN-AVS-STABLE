pub mod stablecoin;
pub mod collateral;

// Explicitly re-export with qualified names to avoid name collisions
pub use stablecoin::{StablecoinConfig, StablecoinVault, UserStablecoin};
pub use collateral::{UserCollateral, StablebondInfo};

// Re-export with namespace to distinguish the two CollateralType enums
pub use stablecoin::CollateralType as StablecoinCollateralType;
pub use collateral::CollateralType as UserCollateralType; 