import { Router } from 'express';
import * as oracleController from '../controllers/oracleController';
import * as restakingController from '../controllers/restakingController';
import * as governanceController from '../controllers/governanceController';
import * as featureController from '../controllers/featureController';

const router = Router();

// Feature status routes
router.get('/features', (req, res) => featureController.getFeatureStatus(req, res));
router.get('/features/test-jito', (req, res) => featureController.testJitoConnection(req, res));

// Oracle routes
router.get('/oracle/price/:assetId', (req, res) => oracleController.getAssetPrice(req, res));
router.get('/oracle/operators', (req, res) => oracleController.getOperators(req, res));

// Restaking routes
router.get('/restaking/vaults', (req, res) => restakingController.getVaults(req, res));
router.get('/restaking/positions/:walletAddress', (req, res) => restakingController.getUserPositions(req, res));
router.post('/restaking/stake', (req, res) => restakingController.stakeToVault(req, res));
router.post('/restaking/unstake', (req, res) => restakingController.unstakeFromVault(req, res));

// Governance routes
router.post('/governance/execute', (req, res) => governanceController.executeProposal(req, res));

export default router;