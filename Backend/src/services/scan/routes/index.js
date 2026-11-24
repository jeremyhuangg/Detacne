import { Router } from 'express';
import scanController from '../controller/scan_controller.js';
import { validate } from '../../../middlewares/validate.js';
import authenticateToken from '../../../middlewares/auth.js';
import { scanPayloadSchema, savePayloadSchema } from '../validator/schema.js';

const router = Router();

router.post('/scan', authenticateToken, validate(scanPayloadSchema), scanController.scan);
router.post('/save', authenticateToken, validate(savePayloadSchema), scanController.save);

export default router;