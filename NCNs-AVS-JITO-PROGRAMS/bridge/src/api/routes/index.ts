import { Router } from 'express';
import * as oracleController from '../controllers/oracleController';
import * as restakingController from '../controllers/restakingController';
import * as governanceController from '../controllers/governanceController';
import * as featureController from '../controllers/featureController';

const router = Router();

// Feature status routes
router.get('/features', featureController.getFeatureStatus);

// Oracle routes
router.get('/oracle/price/:assetId', oracleController.getAssetPrice);
router.get('/oracle/operators', oracleController.getOperators);

// Restaking routes
router.get('/restaking/vaults', restakingController.getVaults);
router.get('/restaking/positions/:walletAddress', restakingController.getUserPositions);
router.post('/restaking/stake', restakingController.stakeToVault);
router.post('/restaking/unstake', restakingController.unstakeFromVault);

// Governance routes
router.post('/governance/execute', governanceController.executeProposal);

export default router;