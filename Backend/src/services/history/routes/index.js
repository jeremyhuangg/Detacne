import { Router } from 'express';
import historyController from '../controller/history-controller.js';
import authenticateToken from '../../../security/token-manager.js';

const router = Router();

router.get('/history', authenticateToken, historyController.getHistory);
router.get('/history/:id', authenticateToken, historyController.getHistoryById);

export default router;