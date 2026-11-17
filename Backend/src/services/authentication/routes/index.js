import { Router } from 'express';
import authenticationController from '../controller/authentication-controller.js';
import { validate } from '../../../middlewares/validate.js';
import {
    postAuthenticationPayloadSchema,
    putAuthenticationPayloadSchema,
    deleteAuthenticationPayloadSchema,
} from '../validator/schema.js';

const router = Router();

router.post('/authentications', validate(postAuthenticationPayloadSchema), authenticationController.login);
router.put('/authentications', validate(putAuthenticationPayloadSchema), authenticationController.refreshToken);
router.delete('/authentications', validate(deleteAuthenticationPayloadSchema), authenticationController.logout);

export default router;