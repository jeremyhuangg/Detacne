import { Router } from 'express';
import userController from '../controller/user-controller.js';
import forgotPasswordController from '../controller/forgot-password-controller.js';
import { validate } from '../../../middlewares/validate.js';
import { userPayloadSchema, changePasswordPayloadSchema, forgotPasswordPayloadSchema, resetPasswordPayloadSchema, changeNicknamePayloadSchema } from '../validator/schema.js';
import authenticateToken from '../../../middlewares/auth.js';

const router = Router();

router.post('/users', validate(userPayloadSchema), userController.createUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/change-password', authenticateToken, validate(changePasswordPayloadSchema), userController.changePassword);
router.put('/users', authenticateToken, validate(changeNicknamePayloadSchema), userController.changeNickname);
router.post('/forgot-password', validate(forgotPasswordPayloadSchema), forgotPasswordController.forgotPassword);
router.post('/reset-password', validate(resetPasswordPayloadSchema), forgotPasswordController.resetPassword);

export default router;