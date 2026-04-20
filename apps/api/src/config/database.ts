import pg from 'pg';
import bcrypt from 'bcrypt';

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
      console.log('✅ Database sudah siap. Menjalankan migrasi tambahan...');
      await runAdditionalMigrations();
    }

    // Seed akun admin default
    await seedAdminUser();
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
  console.log('✅ Migrasi 001_init berhasil!');

  // Jalankan migrasi tambahan
  await runAdditionalMigrations();
}

/**
 * Run additional migration scripts (safe to re-run).
 */
async function runAdditionalMigrations() {
  const { readFileSync, existsSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Coba beberapa path — karena struktur folder bisa beda antara dev dan Docker
  const possiblePaths = [
    join(__dirname, '..', 'migrations', '002_admin_role.sql'),       // dev: src/config -> src/migrations
    join(__dirname, '..', '..', 'migrations', '002_admin_role.sql'), // docker: dist/config -> migrations
    join(process.cwd(), 'migrations', '002_admin_role.sql'),         // docker: /app/migrations
  ];

  let found002 = false;
  for (const migrationPath of possiblePaths) {
    if (existsSync(migrationPath)) {
      console.log(`📂 Ditemukan migrasi 002 di: ${migrationPath}`);
      const sql = readFileSync(migrationPath, 'utf-8');
      await query(sql);
      console.log('✅ Migrasi 002_admin_role berhasil!');
      found002 = true;
      break;
    }
  }

  if (!found002) {
    console.log('⚠️  File migrasi 002_admin_role.sql tidak ditemukan di path manapun.');
    console.log('   Mencoba ALTER TABLE langsung...');
    
    // Fallback: jalankan SQL langsung tanpa file
    try {
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'guru'");
      await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)');
      console.log('✅ Kolom role berhasil ditambahkan via fallback!');
    } catch (err) {
      console.error('⚠️  Gagal menambah kolom role:', err);
    }
  }

  // Migrasi untuk Tabel master_referensi
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS master_referensi (
          id          SERIAL PRIMARY KEY,
          nilai       VARCHAR(255) NOT NULL,
          jenis       VARCHAR(50) NOT NULL,
          created_at  TIMESTAMP DEFAULT NOW(),
          CONSTRAINT uq_referensi_nilai_jenis UNIQUE (nilai, jenis)
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_referensi_jenis ON master_referensi (jenis);`);
    
    // Seed default data
    await query(`
      INSERT INTO master_referensi (nilai, jenis) VALUES
          ('KBM', 'kegiatan'),
          ('Membimbing Siswa', 'kegiatan'),
          ('Tugas Tambahan', 'kegiatan'),
          ('Tugas Lainnya', 'kegiatan'),
          ('Wali Kelas', 'tugas'),
          ('Guru Piket', 'tugas'),
          ('Pembina Pramuka', 'tugas'),
          ('Libur Nasional', 'kalender'),
          ('Cuti Bersama', 'kalender'),
          ('Ujian Semester', 'kalender')
      ON CONFLICT ON CONSTRAINT uq_referensi_nilai_jenis DO NOTHING;
    `);
    console.log('✅ Tabel master_referensi siap!');
  } catch (err) {
    console.error('⚠️  Gagal membuat tabel master_referensi:', err);
  }

  // Migrasi untuk Tabel master_kalender
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS master_kalender (
          id              SERIAL PRIMARY KEY,
          tanggal_mulai   VARCHAR(10) NOT NULL,
          tanggal_selesai VARCHAR(10) NOT NULL,
          status          VARCHAR(50) NOT NULL,
          keterangan      TEXT,
          created_at      TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_kalender_tanggal ON master_kalender (tanggal_mulai);`);
    console.log('✅ Tabel master_kalender siap!');
  } catch (err) {
    console.error('⚠️  Gagal membuat tabel master_kalender:', err);
  }
}

/**
 * Seed akun Super Admin default.
 * Hanya dibuat jika belum ada — aman dipanggil berulang kali.
 */
async function seedAdminUser() {
  const ADMIN_NIP = 'admin@mandalotim.id';
  const ADMIN_NAMA = 'Super Admin';
  const ADMIN_PASSWORD = 'PasswordAdmin123!';

  try {
    const existing = await query('SELECT id FROM users WHERE nip = $1', [ADMIN_NIP]);
    if (existing.rows.length > 0) {
      // Pastikan role-nya admin (jaga-jaga jika sebelumnya terdaftar sebagai guru)
      await query('UPDATE users SET role = $1 WHERE nip = $2', ['admin', ADMIN_NIP]);
      console.log('✅ Akun admin sudah ada — role dipastikan admin.');
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await query(
      'INSERT INTO users (nip, nama, password_hash, role) VALUES ($1, $2, $3, $4)',
      [ADMIN_NIP, ADMIN_NAMA, passwordHash, 'admin']
    );
    console.log('🔐 Akun Super Admin berhasil dibuat!');
    console.log(`   User : ${ADMIN_NIP}`);
    console.log(`   Pass : ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('⚠️  Gagal seed admin (non-fatal):', error);
  }
}

export default pool;

