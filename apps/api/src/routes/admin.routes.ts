import { Router } from 'express';
import { getStats, getUsers, getUserDetail, deleteUser, resetUserData } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Semua route admin memerlukan autentikasi + role admin
router.use(authenticate);
router.use(requireAdmin);

// Dashboard statistik
router.get('/stats', getStats);

// Daftar semua guru
router.get('/users', getUsers);

// Detail data guru (termasuk LKH per bulan)
router.get('/users/:id', getUserDetail);

// Reset data sync guru
router.post('/users/:id/reset', resetUserData);

// Hapus akun guru
router.delete('/users/:id', deleteUser);

export default router;
