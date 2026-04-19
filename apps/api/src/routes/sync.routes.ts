import { Router } from 'express';
import { pushData, pullData } from '../controllers/sync.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Semua endpoint sync memerlukan autentikasi
router.use(authenticate);

// PUSH: Upload data lokal ke server
router.post('/push', pushData);

// PULL: Download data server ke lokal
router.post('/pull', pullData);

export default router;
