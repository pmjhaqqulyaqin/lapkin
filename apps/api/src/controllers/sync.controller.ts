import type { Request, Response } from 'express';
import { query, getClient } from '../config/database.js';

/**
 * POST /api/sync/push
 * Menerima data dari perangkat client dan menyimpan/update di server.
 * Menggunakan UPSERT (INSERT ON CONFLICT UPDATE) untuk setiap tabel.
 * 
 * Body: {
 *   profil: { ... },
 *   jadwal: [ ... ],
 *   tugasTambahan: [ ... ],
 *   lkh: [ ... ],
 *   kalender: [ ... ]
 * }
 */
export async function pushData(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const client = await getClient();

  try {
    const { profil, jadwal, tugasTambahan, lkh, kalender } = req.body;

    await client.query('BEGIN');

    // --- 1. UPSERT Profil ---
    if (profil) {
      await client.query(`
        INSERT INTO sync_profil (user_id, nama, nip, jabatan, pangkat, golongan, nama_kepsek, nip_kepsek, ttd_url, avatar_url, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) DO UPDATE SET
          nama = EXCLUDED.nama,
          nip = EXCLUDED.nip,
          jabatan = EXCLUDED.jabatan,
          pangkat = EXCLUDED.pangkat,
          golongan = EXCLUDED.golongan,
          nama_kepsek = EXCLUDED.nama_kepsek,
          nip_kepsek = EXCLUDED.nip_kepsek,
          ttd_url = EXCLUDED.ttd_url,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = EXCLUDED.updated_at
      `, [
        userId,
        profil.nama, profil.nip, profil.jabatan,
        profil.pangkat, profil.golongan,
        profil.namaKepsek, profil.nipKepsek,
        profil.ttdUrl || null, profil.avatarUrl || null,
        profil.updatedAt || Date.now()
      ]);
    }

    // --- 2. UPSERT Jadwal ---
    if (jadwal && Array.isArray(jadwal)) {
      for (const item of jadwal) {
        await client.query(`
          INSERT INTO sync_jadwal (client_id, user_id, hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, ruangan, warna, updated_at, is_deleted)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (user_id, client_id) DO UPDATE SET
            hari = EXCLUDED.hari,
            jam_mulai = EXCLUDED.jam_mulai,
            jam_selesai = EXCLUDED.jam_selesai,
            mata_pelajaran = EXCLUDED.mata_pelajaran,
            kelas = EXCLUDED.kelas,
            ruangan = EXCLUDED.ruangan,
            warna = EXCLUDED.warna,
            updated_at = EXCLUDED.updated_at,
            is_deleted = EXCLUDED.is_deleted
        `, [
          item.id, userId,
          item.hari, item.jamMulai, item.jamSelesai,
          item.mataPelajaran, item.kelas,
          item.ruangan || null, item.warna || null,
          item.updatedAt || Date.now(),
          item.isDeleted || false
        ]);
      }
    }

    // --- 3. UPSERT Tugas Tambahan ---
    if (tugasTambahan && Array.isArray(tugasTambahan)) {
      for (const item of tugasTambahan) {
        await client.query(`
          INSERT INTO sync_tugas_tambahan (client_id, user_id, nama_tugas, kategori, templates, is_draft, updated_at, is_deleted)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id, client_id) DO UPDATE SET
            nama_tugas = EXCLUDED.nama_tugas,
            kategori = EXCLUDED.kategori,
            templates = EXCLUDED.templates,
            is_draft = EXCLUDED.is_draft,
            updated_at = EXCLUDED.updated_at,
            is_deleted = EXCLUDED.is_deleted
        `, [
          item.id, userId,
          item.namaTugas, item.kategori,
          JSON.stringify(item.templates || []),
          item.isDraft || false,
          item.updatedAt || Date.now(),
          item.isDeleted || false
        ]);
      }
    }

    // --- 4. UPSERT LKH ---
    if (lkh && Array.isArray(lkh)) {
      for (const item of lkh) {
        await client.query(`
          INSERT INTO sync_lkh (client_id, user_id, tanggal, kegiatan, uraian, keterangan_output, sumber_id, tipe_sumber, created_at, updated_at, is_deleted)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (user_id, client_id) DO UPDATE SET
            tanggal = EXCLUDED.tanggal,
            kegiatan = EXCLUDED.kegiatan,
            uraian = EXCLUDED.uraian,
            keterangan_output = EXCLUDED.keterangan_output,
            sumber_id = EXCLUDED.sumber_id,
            tipe_sumber = EXCLUDED.tipe_sumber,
            updated_at = EXCLUDED.updated_at,
            is_deleted = EXCLUDED.is_deleted
        `, [
          item.id, userId,
          item.tanggal, item.kegiatan, item.uraian,
          item.keteranganOutput || null,
          item.sumberId || null, item.tipeSumber,
          item.createdAt || Date.now(),
          item.updatedAt || Date.now(),
          item.isDeleted || false
        ]);
      }
    }

    // --- 5. UPSERT Kalender ---
    if (kalender && Array.isArray(kalender)) {
      for (const item of kalender) {
        await client.query(`
          INSERT INTO sync_kalender (client_id, user_id, tanggal, status, keterangan, updated_at, is_deleted)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, client_id) DO UPDATE SET
            tanggal = EXCLUDED.tanggal,
            status = EXCLUDED.status,
            keterangan = EXCLUDED.keterangan,
            updated_at = EXCLUDED.updated_at,
            is_deleted = EXCLUDED.is_deleted
        `, [
          item.id, userId,
          item.tanggal, item.status, item.keterangan,
          item.updatedAt || Date.now(),
          item.isDeleted || false
        ]);
      }
    }

    await client.query('COMMIT');

    const serverTimestamp = Date.now();

    console.log(`📤 PUSH berhasil untuk user_id=${userId} — ts=${serverTimestamp}`);

    res.json({
      success: true,
      message: 'Data berhasil disinkronkan ke server.',
      serverTimestamp,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Push error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menyimpan data ke server.',
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/sync/pull
 * Mengirim data server yang berubah sejak `since` timestamp ke client.
 * 
 * Body: { since: number } (epoch ms timestamp of last sync)
 */
export async function pullData(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;

  try {
    const since = parseInt(req.body.since || '0', 10);

    // Query semua data yang berubah sejak timestamp terakhir
    const [profilResult, jadwalResult, tugasResult, lkhResult, kalenderResult] = await Promise.all([
      query(
        'SELECT * FROM sync_profil WHERE user_id = $1 AND updated_at > $2',
        [userId, since]
      ),
      query(
        'SELECT * FROM sync_jadwal WHERE user_id = $1 AND updated_at > $2',
        [userId, since]
      ),
      query(
        'SELECT * FROM sync_tugas_tambahan WHERE user_id = $1 AND updated_at > $2',
        [userId, since]
      ),
      query(
        'SELECT * FROM sync_lkh WHERE user_id = $1 AND updated_at > $2',
        [userId, since]
      ),
      query(
        'SELECT * FROM sync_kalender WHERE user_id = $1 AND updated_at > $2',
        [userId, since]
      ),
    ]);

    const serverTimestamp = Date.now();

    // Map database columns (snake_case) -> client format (camelCase)
    const profil = profilResult.rows.length > 0 ? mapProfilToClient(profilResult.rows[0]) : null;
    const jadwal = jadwalResult.rows.map(mapJadwalToClient);
    const tugasTambahan = tugasResult.rows.map(mapTugasToClient);
    const lkh = lkhResult.rows.map(mapLkhToClient);
    const kalender = kalenderResult.rows.map(mapKalenderToClient);

    const totalChanges = (profil ? 1 : 0) + jadwal.length + tugasTambahan.length + lkh.length + kalender.length;

    console.log(`📥 PULL untuk user_id=${userId} — since=${since} — ${totalChanges} perubahan`);

    res.json({
      success: true,
      serverTimestamp,
      data: {
        profil,
        jadwal,
        tugasTambahan,
        lkh,
        kalender,
      },
    });
  } catch (error) {
    console.error('❌ Pull error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data dari server.',
    });
  }
}

// =============================================
// Helper: Map snake_case DB rows -> camelCase client
// =============================================

function mapProfilToClient(row: Record<string, unknown>) {
  return {
    nama: row.nama,
    nip: row.nip,
    jabatan: row.jabatan,
    pangkat: row.pangkat,
    golongan: row.golongan,
    namaKepsek: row.nama_kepsek,
    nipKepsek: row.nip_kepsek,
    ttdUrl: row.ttd_url,
    avatarUrl: row.avatar_url,
    updatedAt: Number(row.updated_at),
  };
}

function mapJadwalToClient(row: Record<string, unknown>) {
  return {
    clientId: row.client_id,
    hari: row.hari,
    jamMulai: row.jam_mulai,
    jamSelesai: row.jam_selesai,
    mataPelajaran: row.mata_pelajaran,
    kelas: row.kelas,
    ruangan: row.ruangan,
    warna: row.warna,
    updatedAt: Number(row.updated_at),
    isDeleted: row.is_deleted,
  };
}

function mapTugasToClient(row: Record<string, unknown>) {
  return {
    clientId: row.client_id,
    namaTugas: row.nama_tugas,
    kategori: row.kategori,
    templates: row.templates,
    isDraft: row.is_draft,
    updatedAt: Number(row.updated_at),
    isDeleted: row.is_deleted,
  };
}

function mapLkhToClient(row: Record<string, unknown>) {
  return {
    clientId: row.client_id,
    tanggal: row.tanggal,
    kegiatan: row.kegiatan,
    uraian: row.uraian,
    keteranganOutput: row.keterangan_output,
    sumberId: row.sumber_id,
    tipeSumber: row.tipe_sumber,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    isDeleted: row.is_deleted,
  };
}

function mapKalenderToClient(row: Record<string, unknown>) {
  return {
    clientId: row.client_id,
    tanggal: row.tanggal,
    status: row.status,
    keterangan: row.keterangan,
    updatedAt: Number(row.updated_at),
    isDeleted: row.is_deleted,
  };
}
