import { Router } from 'express';
import otpController from '../controller/otp-controller.js';
import { validate } from '../../../middlewares/validate.js';
import otpPayloadSchema from '../validation/schema.js';

const router = Router();

router.post('/users/registration-otp', otpController.createOtp);
router.post('/users/registration-otp/verify', validate(otpPayloadSchema), otpController.verifyOtp);
router.post('/users/registration-otp/resend', otpController.resendOtp);

export default router;