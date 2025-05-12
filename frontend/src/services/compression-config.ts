// Default to enabled for the hackathon demo
const COMPRESSION_ENABLED_DEFAULT = true;

export const getCompressionEnabled = (): boolean => {
  const stored = localStorage.getItem('compression-enabled');
  if (stored === null) {
    return COMPRESSION_ENABLED_DEFAULT;
  }
  return stored === 'true';
};

export const setCompressionEnabled = (enabled: boolean): void => {
  localStorage.setItem('compression-enabled', enabled.toString());
};

export const getCompressionRpcUrl = (): string => {
  return process.env.COMPRESSION_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
}; 