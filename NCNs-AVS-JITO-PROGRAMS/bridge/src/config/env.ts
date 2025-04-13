import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  SOLANA_RPC_URL: string;
  SOLANA_WS_URL: string;
  CAMBRIAN_AVS_HTTP_URL: string;
  CAMBRIAN_AVS_WS_URL: string;
  LOG_LEVEL: string;
  FEATURE_FLAG_NCN_ENABLED: boolean;
  FEATURE_FLAG_JITO_RESTAKING_ENABLED: boolean;
}

// Default configuration values
const defaultConfig: EnvConfig = {
  PORT: 3002,
  SOLANA_RPC_URL: 'https://api.testnet.sonic.game',
  SOLANA_WS_URL: 'wss://api.testnet.sonic.game',
  CAMBRIAN_AVS_HTTP_URL: 'http://localhost:3000',
  CAMBRIAN_AVS_WS_URL: 'ws://localhost:3000/ws',
  LOG_LEVEL: 'info',
  FEATURE_FLAG_NCN_ENABLED: true,
  FEATURE_FLAG_JITO_RESTAKING_ENABLED: true,
};

// Parse environment variables with type checking
const config: EnvConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : defaultConfig.PORT,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || defaultConfig.SOLANA_RPC_URL,
  SOLANA_WS_URL: process.env.SOLANA_WS_URL || defaultConfig.SOLANA_WS_URL,
  CAMBRIAN_AVS_HTTP_URL: process.env.CAMBRIAN_AVS_HTTP_URL || defaultConfig.CAMBRIAN_AVS_HTTP_URL,
  CAMBRIAN_AVS_WS_URL: process.env.CAMBRIAN_AVS_WS_URL || defaultConfig.CAMBRIAN_AVS_WS_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || defaultConfig.LOG_LEVEL,
  FEATURE_FLAG_NCN_ENABLED: process.env.FEATURE_FLAG_NCN_ENABLED 
    ? process.env.FEATURE_FLAG_NCN_ENABLED.toLowerCase() === 'true' 
    : defaultConfig.FEATURE_FLAG_NCN_ENABLED,
  FEATURE_FLAG_JITO_RESTAKING_ENABLED: process.env.FEATURE_FLAG_JITO_RESTAKING_ENABLED 
    ? process.env.FEATURE_FLAG_JITO_RESTAKING_ENABLED.toLowerCase() === 'true' 
    : defaultConfig.FEATURE_FLAG_JITO_RESTAKING_ENABLED,
};

export default config; 