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

import { addKalender, updateKalender, deleteKalender } from '../controllers/kalender.controller.js';
// Routes for Master Kalender
router.post('/kalender', addKalender);
router.put('/kalender/:id', updateKalender);
router.delete('/kalender/:id', deleteKalender);

export default router;
