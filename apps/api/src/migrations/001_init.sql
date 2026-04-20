-- =============================================
-- LKD Sync Database — Initial Migration
-- =============================================
-- Tabel ini digunakan untuk menyimpan data sinkronisasi
-- dari aplikasi LKD PWA (Laporan Kinerja Digital).
-- =============================================

-- 1. Tabel Users: Akun pengguna untuk autentikasi sync
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    nip             VARCHAR(30) UNIQUE NOT NULL,
    nama            VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel Sync Profil: Data profil guru
CREATE TABLE IF NOT EXISTS sync_profil (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nama            VARCHAR(255),
    nip             VARCHAR(30),
    jabatan         VARCHAR(255),
    pangkat         VARCHAR(100),
    golongan        VARCHAR(50),
    nama_kepsek     VARCHAR(255),
    nip_kepsek      VARCHAR(30),
    ttd_url         TEXT,
    avatar_url      TEXT,
    updated_at      BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_profil_user UNIQUE (user_id)
);

-- 3. Tabel Sync Jadwal: Jadwal mengajar
CREATE TABLE IF NOT EXISTS sync_jadwal (
    id              SERIAL PRIMARY KEY,
    client_id       INT NOT NULL,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hari            VARCHAR(10),
    jam_mulai       VARCHAR(10),
    jam_selesai     VARCHAR(10),
    mata_pelajaran  VARCHAR(255),
    kelas           VARCHAR(100),
    ruangan         VARCHAR(100),
    warna           VARCHAR(20),
    updated_at      BIGINT NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_jadwal_user_client UNIQUE (user_id, client_id)
);

-- 4. Tabel Sync Tugas Tambahan
CREATE TABLE IF NOT EXISTS sync_tugas_tambahan (
    id              SERIAL PRIMARY KEY,
    client_id       INT NOT NULL,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nama_tugas      VARCHAR(255),
    kategori        VARCHAR(255),
    templates       JSONB,
    is_draft        BOOLEAN DEFAULT FALSE,
    updated_at      BIGINT NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_tugas_user_client UNIQUE (user_id, client_id)
);

-- 5. Tabel Sync LKH (Laporan Kinerja Harian)
CREATE TABLE IF NOT EXISTS sync_lkh (
    id              SERIAL PRIMARY KEY,
    client_id       INT NOT NULL,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal         VARCHAR(10),
    kegiatan        VARCHAR(500),
    uraian          TEXT,
    keterangan_output TEXT,
    sumber_id       INT,
    tipe_sumber     VARCHAR(20),
    created_at      BIGINT,
    updated_at      BIGINT NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_lkh_user_client UNIQUE (user_id, client_id)
);

-- 6. Tabel Sync Kalender Akademik
CREATE TABLE IF NOT EXISTS sync_kalender (
    id              SERIAL PRIMARY KEY,
    client_id       INT NOT NULL,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tanggal         VARCHAR(10),
    status          VARCHAR(20),
    keterangan      TEXT,
    updated_at      BIGINT NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_kalender_user_client UNIQUE (user_id, client_id)
);

-- =============================================
-- Indexes untuk performa query sinkronisasi
-- =============================================

-- Index pada updated_at untuk query "berikan data yang berubah sejak timestamp X"
CREATE INDEX IF NOT EXISTS idx_jadwal_updated ON sync_jadwal (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_tugas_updated ON sync_tugas_tambahan (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_lkh_updated ON sync_lkh (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_kalender_updated ON sync_kalender (user_id, updated_at);

-- Index pada NIP untuk login cepat
CREATE INDEX IF NOT EXISTS idx_users_nip ON users (nip);

-- =============================================
-- Tabel Master Referensi (Global Admin)
-- =============================================

-- 7. Tabel Master Referensi: Data opsi global untuk aplikasi
CREATE TABLE IF NOT EXISTS master_referensi (
    id          SERIAL PRIMARY KEY,
    nilai       VARCHAR(255) NOT NULL,
    jenis       VARCHAR(50) NOT NULL, -- 'kegiatan', 'tugas', 'kalender'
    created_at  TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_referensi_nilai_jenis UNIQUE (nilai, jenis)
);

CREATE INDEX IF NOT EXISTS idx_referensi_jenis ON master_referensi (jenis);

-- Insert data default jika tabel kosong
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

-- 8. Tabel Master Kalender: Data jadwal akademik global untuk aplikasi
CREATE TABLE IF NOT EXISTS master_kalender (
    id              SERIAL PRIMARY KEY,
    tanggal_mulai   VARCHAR(10) NOT NULL,
    tanggal_selesai VARCHAR(10) NOT NULL,
    status          VARCHAR(50) NOT NULL,
    keterangan      TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kalender_tanggal ON master_kalender (tanggal_mulai);
