import { Router } from 'express';
import articlePayloadSchema from '../validator/schema.js';
import articleController from '../controller/article-controller.js';

const router = Router();

router.get('/article', articleController.getArticle);
router.get('/article/:id', articleController.getArticleById);

export default router;