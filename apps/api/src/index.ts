import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import syncRoutes from './routes/sync.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// =============================================
// Middleware
// =============================================

// CORS — Izinkan request dari frontend PWA
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSON body parser — Batas 10MB untuk data avatar/ttd base64
app.use(express.json({ limit: '10mb' }));

// =============================================
// Routes
// =============================================

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LKD Sync API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes: /api/auth/register, /api/auth/login, /api/auth/me
app.use('/api/auth', authRoutes);

// Sync routes: /api/sync/push, /api/sync/pull
app.use('/api/sync', syncRoutes);

// Admin routes: /api/admin/stats, /api/admin/users, etc.
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan.',
  });
});

// =============================================
// Start Server
// =============================================
async function start() {
  try {
    // Initialize database (run migrations if needed)
    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🚀 LKD Sync API');
      console.log(`📡 Server berjalan di http://0.0.0.0:${PORT}`);
      console.log(`🏠 Health check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('❌ Gagal memulai server:', error);
    process.exit(1);
  }
}

start();
