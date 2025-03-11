import { Request, Response } from 'express';
import cambrianService from '../../services/cambrianService';
import { createApiResponse, createErrorResponse } from '../../utils';

/**
 * Execute a governance proposal using Cambrian payload
 */
export async function executeProposal(req: Request, res: Response) {
  try {
    const { proposalId, payloadImage } = req.body;
    
    if (!proposalId || isNaN(proposalId)) {
      return res.status(400).json(createErrorResponse('Valid proposal ID is required'));
    }
    
    if (!payloadImage || typeof payloadImage !== 'string') {
      return res.status(400).json(createErrorResponse('Valid payload image name is required'));
    }
    
    const result = await cambrianService.executeProposal(proposalId, payloadImage);
    
    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Failed to execute proposal'));
    }
    
    return res.json(createApiResponse(result));
  } catch (error) {
    console.error('Error in executeProposal:', error);
    return res.status(500).json(createErrorResponse('Internal server error'));
  }
} 