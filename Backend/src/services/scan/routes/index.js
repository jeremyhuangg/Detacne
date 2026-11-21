import { Router } from 'express';
import scanController from '../controller/scan_controller.js';
import { validate } from '../../../middlewares/validate.js';
import { scanPayloadSchema } from '../validation/schema.js';

const router = Router();

router.post('/scan', validate(scanPayloadSchema), scanController.scan);

export default router;