import { Request, Response } from 'express';
import jitoRestakingService from '../../services/jitoRestakingService';
import { createApiResponse, createErrorResponse, isValidPublicKey } from '../../utils';

/**
 * Get all available Jito vaults
 */
export async function getVaults(req: Request, res: Response) {
  try {
    const vaults = await jitoRestakingService.getVaults();
    return res.json(createApiResponse(vaults));
  } catch (error) {
    console.error('Error in getVaults:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
}

/**
 * Get a user's staking positions
 */
export async function getUserPositions(req: Request, res: Response) {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress || !isValidPublicKey(walletAddress)) {
      return res.status(400).json(createErrorResponse('Valid wallet address is required'));
    }
    
    const positions = await jitoRestakingService.getUserPositions(walletAddress);
    return res.json(createApiResponse(positions));
  } catch (error) {
    console.error('Error in getUserPositions:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
}

/**
 * Stake tokens to a Jito vault
 */
export async function stakeToVault(req: Request, res: Response) {
  try {
    const { walletAddress, vaultAddress, amount, lockPeriod } = req.body;
    
    if (!walletAddress || !isValidPublicKey(walletAddress)) {
      return res.status(400).json(createErrorResponse('Valid wallet address is required'));
    }
    
    if (!vaultAddress || !isValidPublicKey(vaultAddress)) {
      return res.status(400).json(createErrorResponse('Valid vault address is required'));
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json(createErrorResponse('Valid amount is required'));
    }
    
    const result = await jitoRestakingService.stakeToVault(
      walletAddress,
      vaultAddress,
      amount,
      lockPeriod || 0
    );
    
    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Failed to stake tokens'));
    }
    
    return res.json(createApiResponse(result));
  } catch (error) {
    console.error('Error in stakeToVault:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
}

/**
 * Unstake tokens from a Jito vault
 */
export async function unstakeFromVault(req: Request, res: Response) {
  try {
    const { walletAddress, vaultAddress, amount } = req.body;
    
    if (!walletAddress || !isValidPublicKey(walletAddress)) {
      return res.status(400).json(createErrorResponse('Valid wallet address is required'));
    }
    
    if (!vaultAddress || !isValidPublicKey(vaultAddress)) {
      return res.status(400).json(createErrorResponse('Valid vault address is required'));
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json(createErrorResponse('Valid amount is required'));
    }
    
    const result = await jitoRestakingService.unstakeFromVault(
      walletAddress,
      vaultAddress,
      amount
    );
    
    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Failed to unstake tokens'));
    }
    
    return res.json(createApiResponse(result));
  } catch (error) {
    console.error('Error in unstakeFromVault:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
} 