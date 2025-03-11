import { Request, Response } from 'express';
import cambrianService from '../../services/cambrianService';
import { createApiResponse, createErrorResponse } from '../../utils';

/**
 * Get price data for a specific asset from the NCN oracle
 */
export async function getAssetPrice(req: Request, res: Response) {
  try {
    const { assetId } = req.params;
    
    if (!assetId) {
      return res.status(400).json(createErrorResponse('Asset ID is required'));
    }
    
    const oracleData = await cambrianService.getOracleData(assetId);
    
    if (!oracleData) {
      return res.status(404).json(createErrorResponse(`No oracle data found for asset ${assetId}`));
    }
    
    return res.json(createApiResponse(oracleData));
  } catch (error) {
    console.error('Error in getAssetPrice:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
}

/**
 * Get all NCN operators
 */
export async function getOperators(req: Request, res: Response) {
  try {
    const operators = await cambrianService.getOperators();
    return res.json(createApiResponse(operators));
  } catch (error) {
    console.error('Error in getOperators:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
} 