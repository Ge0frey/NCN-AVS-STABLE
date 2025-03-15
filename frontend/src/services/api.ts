const API_BASE_URL = 'http://localhost:3001/api';

// General fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Feature flags
export async function getFeatureFlags() {
  return fetchAPI<{ncnEnabled: boolean; jitoRestakingEnabled: boolean}>('/features');
}

// Oracle services
export async function getAssetPrice(assetId: string) {
  return fetchAPI<{assetId: string; price: number; timestamp: number; source: string; confidence: number}>(
    `/oracle/price/${assetId}`
  );
}

export async function getOperators() {
  return fetchAPI<Array<{publicKey: string; name: string; status: string; stake: number; rewardShare: number}>>(
    '/oracle/operators'
  );
}

// Restaking services
export async function getVaults() {
  return fetchAPI<Array<{address: string; name: string; balance: number; delegatedAmount: number; apy: number}>>(
    '/restaking/vaults'
  );
}

export async function getUserPositions(walletAddress: string) {
  return fetchAPI<Array<{vaultAddress: string; stakedAmount: number; rewards: number; lockPeriod: number; lockExpiry: number | null}>>(
    `/restaking/positions/${walletAddress}`
  );
}

export async function stakeToVault(walletAddress: string, vaultAddress: string, amount: number, lockPeriod: number = 0) {
  return fetchAPI('/restaking/stake', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      vaultAddress,
      amount,
      lockPeriod
    })
  });
}

export async function unstakeFromVault(walletAddress: string, vaultAddress: string, amount: number) {
  return fetchAPI('/restaking/unstake', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      vaultAddress,
      amount
    })
  });
}

// Governance services
export async function executeProposal(proposalId: number, payloadImage: string) {
  return fetchAPI('/governance/execute', {
    method: 'POST',
    body: JSON.stringify({
      proposalId,
      payloadImage
    })
  });
}

export default {
  getFeatureFlags,
  getAssetPrice,
  getOperators,
  getVaults,
  getUserPositions,
  stakeToVault,
  unstakeFromVault,
  executeProposal
}; 