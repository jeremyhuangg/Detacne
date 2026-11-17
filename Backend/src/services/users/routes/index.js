import { Router } from 'express';
import userController from '../controller/user-controller.js';
import { validate } from '../../../middlewares/validate.js';
import { userPayloadSchema } from '../validator/schema.js';

const router = Router();

router.post('/users', validate(userPayloadSchema), userController.createUser);
router.get('/users/:id', userController.getUserById);

export default router;