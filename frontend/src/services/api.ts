const API_BASE_URL = 'http://localhost:3002/api';

// Configurable options
const API_TIMEOUT = 5000; // 5 seconds timeout for API calls
const DEBUG = false; // Set to true to enable verbose logging

// Debug logging
const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`API Debug: ${message}`, data);
  }
};

// General fetch wrapper with error handling and timeout
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  logDebug(`Request: ${endpoint}`);
  
  try {
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const fetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);
    
    logDebug(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logDebug(`Response data:`, data);

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  } catch (error) {
    // Handle AbortError separately
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`API Timeout (${endpoint}) - request took longer than ${API_TIMEOUT}ms`);
      throw new Error(`Request timeout: ${endpoint}`);
    }
    
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Feature flags with fallback defaults
export async function getFeatureFlags() {
  logDebug('Fetching feature flags');
  try {
    return await fetchAPI<{ncnEnabled: boolean; jitoRestakingEnabled: boolean}>('/features');
  } catch (error) {
    console.warn('Failed to fetch feature flags, using defaults:', error);
    return {
      ncnEnabled: true,
      jitoRestakingEnabled: false // Disable Jito as fallback to avoid further errors
    };
  }
}

/**
 * Tests the connection to the Jito Restaking API
 */
export async function testJitoConnection() {
  logDebug('Testing Jito connection');
  try {
    // Try first with a short timeout for quick response
    try {
      return await fetchAPI<{
        success: boolean; 
        message: string; 
        vaultsCount?: number;
        vaultsDataValid?: boolean;
        responseTimeMs?: number;
        shouldEnable?: boolean;
        retried?: boolean;
      }>('/features/test-jito');
    } catch (error) {
      // If it times out or fails, try again with a longer timeout
      console.warn('First Jito connection attempt failed, retrying with extended timeout:', error);
      
      // Create an AbortController with longer timeout for retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT * 2);
      
      try {
        const response = await fetch(`${API_BASE_URL}/features/test-jito`, {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }
        
        return data.data;
      } catch (retryError) {
        throw retryError;
      }
    }
  } catch (error) {
    console.error('Failed to test Jito connection after retry:', error);
    // Return a formatted error object instead of throwing
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error connecting to Jito service',
      shouldEnable: false
    };
  }
}

// Oracle services
export async function getAssetPrice(assetId: string) {
  try {
    return await fetchAPI<{assetId: string; price: number; timestamp: number; source: string; confidence: number}>(
      `/oracle/price/${assetId}`
    );
  } catch (error) {
    console.error(`Failed to fetch price for ${assetId}:`, error);
    throw error;
  }
}

export async function getOperators() {
  try {
    return await fetchAPI<Array<{publicKey: string; name: string; status: string; stake: number; rewardShare: number}>>(
      '/oracle/operators'
    );
  } catch (error) {
    console.error('Failed to fetch operators:', error);
    // Return empty array instead of throwing
    return [];
  }
}

// Restaking services
export async function getVaults() {
  try {
    const vaults = await fetchAPI<Array<{address: string; name: string; balance: number; delegatedAmount: number; apy: number}>>(
      '/restaking/vaults'
    );
    
    logDebug('Retrieved vaults:', vaults);
    return vaults;
  } catch (error) {
    console.error('Failed to fetch vaults:', error);
    
    // Return mock vaults only in development to help with UI testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock vaults data for development');
      return [
        {
          address: 'vault111111111111111111111111111111111111111',
          name: 'Jito Vault (High Yield)',
          balance: 234567.89,
          delegatedAmount: 123456.78,
          apy: 5.67
        },
        {
          address: 'vault222222222222222222222222222222222222222',
          name: 'Jito Vault (Community)',
          balance: 987654.32,
          delegatedAmount: 765432.1,
          apy: 4.5
        },
        {
          address: 'vault333333333333333333333333333333333333333',
          name: 'Jito Vault (Stable Yield)',
          balance: 543210.98,
          delegatedAmount: 432109.87,
          apy: 3.21
        }
      ];
    }
    
    // In production, return empty array
    return [];
  }
}

export async function getUserPositions(walletAddress: string) {
  try {
    return await fetchAPI<Array<{vaultAddress: string; stakedAmount: number; rewards: number; lockPeriod: number; lockExpiry: number | null}>>(
      `/restaking/positions/${walletAddress}`
    );
  } catch (error) {
    console.error(`Failed to fetch positions for ${walletAddress}:`, error);
    // Return empty array instead of throwing
    return [];
  }
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
  testJitoConnection,
  getAssetPrice,
  getOperators,
  getVaults,
  getUserPositions,
  stakeToVault,
  unstakeFromVault,
  executeProposal
}; 