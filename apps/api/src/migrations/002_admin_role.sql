-- =============================================
-- LKD Sync Database — Migration 002: Admin Role
-- =============================================

-- Tambah kolom role ke tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'guru';

-- Buat index pada role untuk query admin
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
