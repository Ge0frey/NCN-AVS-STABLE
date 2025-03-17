import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export type StableFunds = {
  "version": "0.1.0",
  "name": "stablefunds_program",
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
          "isMut": false,
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
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "stablebondTokenAccount",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "vaultStablebondTokenAccount",
          "isMut": false,
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stablebondMint",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "userStablebondTokenAccount",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "vaultStablebondTokenAccount",
          "isMut": false,
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
          "isMut": false,
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
        }
      ]
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
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "stablecoinConfig",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
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
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "stablecoinConfig",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CollateralType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Sol"
          },
          {
            "name": "Stablebond"
          },
          {
            "name": "Usdc"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ]
}; 