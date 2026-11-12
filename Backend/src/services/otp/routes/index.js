import { Router } from 'express';
import otpController from '../controller/otp-controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createOtpPayloadSchema, verifyOtpPayloadSchema, resendOtpPayloadSchema } from '../validation/schema.js';

const router = Router();

router.post('/users/registration-otp', validate(createOtpPayloadSchema), otpController.createOtp);
router.post('/users/registration-otp/verify', validate(verifyOtpPayloadSchema), otpController.verifyOtp);
router.post('/users/registration-otp/resend', validate(resendOtpPayloadSchema), otpController.resendOtp);

export default router;