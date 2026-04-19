import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Protected endpoint
router.get('/me', authenticate, me);

export default router;
