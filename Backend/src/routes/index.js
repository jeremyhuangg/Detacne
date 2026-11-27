import { Router } from 'express';
import users from '../services/users/routes/index.js';
import authentications from '../services/authentication/routes/index.js';
import otps from '../services/otp/routes/index.js';
import scans from '../services/scan/routes/index.js';
import history from '../services/history/routes/index.js';
import article from '../services/article/routes/index.js';

const router = Router();

router.use('/', users);
router.use('/', authentications);
router.use('/', otps);
router.use('/', scans);
router.use('/', history);
router.use('/', article);

export default router;