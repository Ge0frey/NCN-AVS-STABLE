import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export type StableFunds = {
  "version": "0.1.0",
  "name": "stablefunds",
  "instructions": [
    {
      "name": "createStablecoin",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stablecoinConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablecoinVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablecoinMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablebondMint",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "stablebondTokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "vaultStablebondTokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "iconIndex",
          "type": "u8"
        },
        {
          "name": "collateralType",
          "type": {
            "defined": "CollateralType"
          }
        },
        {
          "name": "collateralizationRatio",
          "type": "u64"
        },
        {
          "name": "initialSupply",
          "type": "u64"
        },
        {
          "name": "stablecoinConfigBump",
          "type": "u8"
        },
        {
          "name": "vaultBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositCollateral",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stablecoinConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablecoinVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablebondMint",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "userStablebondTokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "vaultStablebondTokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "userCollateralBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "mintStablecoin",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stablecoinConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablecoinVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablecoinMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userStablecoin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "userStablecoinBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "fetchStablebonds",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stablebondList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "stablecoinConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "iconIndex",
            "type": "u8"
          },
          {
            "name": "collateralType",
            "type": {
              "defined": "CollateralType"
            }
          },
          {
            "name": "collateralizationRatio",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stablecoinVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stablecoinConfig",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userStablecoin",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "stablecoinConfig",
            "type": "publicKey"
          },
          {
            "name": "tokenAccount",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userCollateral",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "stablecoinConfig",
            "type": "publicKey"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "collateralType",
            "type": {
              "defined": "CollateralType"
            }
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StablebondInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bondMint",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "maturityTime",
            "type": "i64"
          },
          {
            "name": "issuanceDate",
            "type": "i64"
          },
          {
            "name": "annualYield",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "CollateralType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "None"
          },
          {
            "name": "Stablebond",
            "fields": [
              {
                "name": "bondMint",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "SOL"
          },
          {
            "name": "USDC"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "StablecoinCreatedEvent",
      "fields": [
        {
          "name": "stablecoinConfig",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "name",
          "type": "string",
          "index": false
        },
        {
          "name": "symbol",
          "type": "string",
          "index": false
        },
        {
          "name": "collateralType",
          "type": "string",
          "index": false
        },
        {
          "name": "initialSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "CollateralDepositedEvent",
      "fields": [
        {
          "name": "stablecoinConfig",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "collateralType",
          "type": "string",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "StablecoinMintedEvent",
      "fields": [
        {
          "name": "stablecoinConfig",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "StablebondsFetchedEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "count",
          "type": "u32",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidStablecoinName",
      "msg": "The stablecoin name is invalid or too long"
    },
    {
      "code": 6001,
      "name": "InvalidStablecoinSymbol",
      "msg": "The stablecoin symbol is invalid or too long"
    },
    {
      "code": 6002,
      "name": "InvalidStablecoinDescription",
      "msg": "The stablecoin description is too long"
    },
    {
      "code": 6003,
      "name": "CollateralizationRatioTooLow",
      "msg": "The collateralization ratio is below the minimum required"
    },
    {
      "code": 6004,
      "name": "InsufficientCollateral",
      "msg": "The collateral amount is insufficient for the requested stablecoin amount"
    },
    {
      "code": 6005,
      "name": "InvalidStablebondMint",
      "msg": "The stablebond mint does not match the expected data"
    },
    {
      "code": 6006,
      "name": "StablebondNotMatured",
      "msg": "The stablebond has not reached maturity"
    },
    {
      "code": 6007,
      "name": "InsufficientStablebondTokens",
      "msg": "The stablebond token account does not have enough tokens"
    },
    {
      "code": 6008,
      "name": "UnsupportedCollateralType",
      "msg": "The provided collateral type is not supported"
    },
    {
      "code": 6009,
      "name": "InvalidTokenAccountOwner",
      "msg": "The token account owner does not match the expected signer"
    },
    {
      "code": 6010,
      "name": "InvalidMintAuthority",
      "msg": "The mint authority does not match the expected program address"
    },
    {
      "code": 6011,
      "name": "InvalidStablecoinState",
      "msg": "The stablecoin configuration is not in a valid state"
    },
    {
      "code": 6012,
      "name": "StablebondFetchFailed",
      "msg": "The stablebond fetch request failed"
    },
    {
      "code": 6013,
      "name": "InsufficientTokens",
      "msg": "Not enough tokens to perform this operation"
    },
    {
      "code": 6014,
      "name": "InvalidIconIndex",
      "msg": "The provided icon index is invalid"
    },
    {
      "code": 6015,
      "name": "InvalidCollateralType",
      "msg": "The provided collateral type is invalid"
    },
    {
      "code": 6016,
      "name": "InvalidInitialSupply",
      "msg": "The initial supply must be greater than zero"
    },
    {
      "code": 6017,
      "name": "UnauthorizedOperation",
      "msg": "Operation not permitted by the authority"
    }
  ]
}; 