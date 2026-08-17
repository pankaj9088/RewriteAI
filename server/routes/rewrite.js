import { Router } from 'express';
import { handleRewrite } from '../controllers/rewriteController.js';
import { validateRewriteRequest } from '../middleware/requestValidator.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/', rateLimiter, validateRewriteRequest, handleRewrite);

export default router;
