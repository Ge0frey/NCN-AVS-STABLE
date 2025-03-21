import { Request, Response } from 'express';
import config from '../../config/env';
import { createApiResponse } from '../../utils';
import jitoRestakingService from '../../services/jitoRestakingService';

/**
 * Get the status of feature flags
 */
export async function getFeatureStatus(req: Request, res: Response) {
  return res.json(createApiResponse({
    ncnEnabled: config.FEATURE_FLAG_NCN_ENABLED,
    jitoRestakingEnabled: config.FEATURE_FLAG_JITO_RESTAKING_ENABLED,
  }));
}

/**
 * Test the connection to Jito Restaking API
 */
export async function testJitoConnection(req: Request, res: Response) {
  try {
    if (!config.FEATURE_FLAG_JITO_RESTAKING_ENABLED) {
      return res.json(createApiResponse({
        success: false,
        message: 'Jito Restaking feature is disabled',
      }));
    }

    // Try to fetch vaults as a simple connection test
    console.log('Testing Jito Restaking connection...');
    let startTime = Date.now();
    const vaults = await jitoRestakingService.getVaults();
    let endTime = Date.now();
    let responseTime = endTime - startTime;
    
    if (vaults.length === 0) {
      console.log('Connected to Jito Restaking, but no vaults were found');
      return res.json(createApiResponse({
        success: true,
        message: 'Connected to Jito Restaking, but no vaults were found',
        vaultsCount: 0,
        responseTimeMs: responseTime
      }));
    }
    
    console.log(`Successfully connected to Jito Restaking, found ${vaults.length} vaults in ${responseTime}ms`);
    
    // Check first vault's data for validity
    let vaultDataValid = vaults[0].balance > 0 || vaults[0].delegatedAmount > 0;
    
    return res.json(createApiResponse({
      success: true,
      message: 'Successfully connected to Jito Restaking',
      vaultsCount: vaults.length,
      vaultsDataValid: vaultDataValid,
      responseTimeMs: responseTime,
      vaultNames: vaults.map(v => v.name)
    }));
  } catch (error) {
    console.error('Error testing Jito connection:', error);
    
    let errorMessage = 'Unknown error connecting to Jito Restaking';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific known error types
      if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Connection timeout: Jito API may be down or unreachable';
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Authentication error: Invalid credentials for Jito API';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        errorMessage = 'Rate limit exceeded: Too many requests to Jito API';
      }
    }
    
    return res.json(createApiResponse({
      success: false,
      message: errorMessage,
    }));
  }
} 