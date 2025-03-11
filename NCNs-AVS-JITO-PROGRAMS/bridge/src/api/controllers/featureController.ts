import { Request, Response } from 'express';
import config from '../../config/env';
import { createApiResponse } from '../../utils';

/**
 * Get the status of feature flags
 */
export async function getFeatureStatus(req: Request, res: Response) {
  try {
    const featureStatus = {
      ncnEnabled: config.FEATURE_FLAG_NCN_ENABLED,
      jitoRestakingEnabled: config.FEATURE_FLAG_JITO_RESTAKING_ENABLED
    };
    
    return res.json(createApiResponse(featureStatus));
  } catch (error) {
    console.error('Error in getFeatureStatus:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
} 