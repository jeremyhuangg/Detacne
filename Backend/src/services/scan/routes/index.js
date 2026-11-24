import { Router } from 'express';
import scanController from '../controller/scan_controller.js';
import { validateFile } from '../../../middlewares/validate.js';
import { scanPayloadSchema, savePayloadSchema } from '../validation/schema.js';

const router = Router();

router.post('/scan', validateFile(scanPayloadSchema), scanController.scan);
router.post('/save', validate(savePayloadSchema), scanController.save);

export default router;