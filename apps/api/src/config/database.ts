import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 10,                    // Maximum 10 connections in pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 5000, // Timeout if connect takes > 5s
});

// Test connection on startup
pool.on('connect', () => {
  console.log('📦 PostgreSQL: Client connected to pool');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Run a SQL query against the database.
 * Wraps pg Pool.query for convenience.
 */
export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 Query executed in ${duration}ms — rows: ${result.rowCount}`);
  }

  return result;
}

/**
 * Get a client from the pool (for transactions).
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Initialize database — run migrations if tables don't exist.
 */
export async function initializeDatabase() {
  try {
    // Check if tables exist
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!result.rows[0].exists) {
      console.log('🏗️  Tabel belum ada. Menjalankan migrasi...');
      await runMigrations();
    } else {
      console.log('✅ Database sudah siap.');
    }
  } catch (error) {
    console.error('❌ Gagal inisialisasi database:', error);
    throw error;
  }
}

/**
 * Run SQL migration scripts.
 */
async function runMigrations() {
  const { readFileSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const migrationPath = join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  await query(sql);
  console.log('✅ Migrasi database berhasil dijalankan!');
}

export default pool;
