import { Router } from 'express';
import scanController from '../controller/scan_controller.js';
import upload from '../../../middlewares/upload.js';
import { validateFile } from '../../../middlewares/validate.js';
import { scanPayloadSchema } from '../validation/schema.js';

const router = Router();

router.post('/scan', upload.single('photo'), validateFile(scanPayloadSchema), scanController.scan);
router.post('/save', validate(savePayloadSchema), scanController.save);

export default router;