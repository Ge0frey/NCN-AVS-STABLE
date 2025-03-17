/**
 * Utilities for working with Solana transactions
 */

// Get the Solana cluster from environment or default to devnet
const SOLANA_CLUSTER = process.env.REACT_APP_SOLANA_CLUSTER || 'devnet';

// Base58 alphabet used by Solana for transaction signatures
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * @returns A
 */
export function generateMockTransactionSignature(): string {
  let signature = '';
  for (let i = 0; i < 88; i++) {
    const randomIndex = Math.floor(Math.random() * BASE58_ALPHABET.length);
    signature += BASE58_ALPHABET[randomIndex];
  }
  return signature;
}

/**
 * Formats a transaction signature for display
 * @param signature The full transaction signature
 * @param truncate Whether to truncate the signature
 * @param length The length to truncate to (characters from start + characters from end)
 * @returns Formatted transaction signature for display
 */
export function formatTransactionSignature(signature: string, truncate = false, length = 16): string {
  if (!truncate || signature.length <= length * 2) {
    return signature;
  }
  
  const start = signature.substring(0, length);
  const end = signature.substring(signature.length - length);
  return `${start}...${end}`;
}

/**
 * @param signature The string to check
 * @returns True if the string resembles a Solana transaction signature
 */
export function isValidTransactionSignature(signature: string): boolean {
  if (!signature || signature.length !== 88) {
    return false;
  }
  
  return [...signature].every(char => BASE58_ALPHABET.includes(char));
}

/**
 * Returns a link to view the transaction on Solana Explorer
 * @param signature Transaction signature
 * @param cluster Network cluster (mainnet, testnet, devnet)
 * @returns URL to view the transaction on Solana Explorer
 */
export function getTransactionExplorerUrl(signature: string, cluster = SOLANA_CLUSTER): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
} 