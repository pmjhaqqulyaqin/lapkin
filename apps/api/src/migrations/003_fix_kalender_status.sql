-- =============================================
-- LKD Sync Database — Migration 003: Fix Kalender Status Length
-- =============================================

-- Widen status column to match master_kalender.status (VARCHAR 50)
ALTER TABLE sync_kalender ALTER COLUMN status TYPE VARCHAR(100);
