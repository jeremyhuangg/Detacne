import { Router } from 'express';
import articlePayloadSchema from '../validator/schema.js';
import articleController from '../controller/article-controller.js';
import authenticateToken from '../../../middlewares/auth.js';
import { isAdmin } from '../../../middlewares/admin.js';

const router = Router();

router.get('/article', articleController.getArticle);
router.get('/article/:id', articleController.getArticleById);

router.post('/article', authenticateToken, isAdmin, articleController.createArticle);
router.put('/article/:id', authenticateToken, isAdmin, articleController.editArticleById);
router.delete('/article/:id', authenticateToken, isAdmin, articleController.deleteArticleById);

export default router;