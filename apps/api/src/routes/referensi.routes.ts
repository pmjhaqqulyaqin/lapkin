import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { 
  getAllReferensi, 
  addReferensi, 
  updateReferensi, 
  deleteReferensi 
} from '../controllers/referensi.controller.js';

const router = Router();

// Endpoint Publik/Semua User (tanpa perlu login)
router.get('/', getAllReferensi);

// Endpoint Khusus Admin
router.post('/', authenticate, requireAdmin, addReferensi);
router.put('/:id', authenticate, requireAdmin, updateReferensi);
router.delete('/:id', authenticate, requireAdmin, deleteReferensi);

export default router;
