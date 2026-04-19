import type { Request, Response } from 'express';
import { query } from '../config/database.js';

/**
 * GET /api/admin/stats
 * Statistik ringkasan untuk dashboard admin.
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const [usersResult, lkhResult, lkhTodayResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users WHERE role = $1', ['guru']),
      query(`
        SELECT COUNT(*) as total FROM sync_lkh 
        WHERE is_deleted = false 
        AND updated_at > $1
      `, [getStartOfMonth()]),
      query(`
        SELECT COUNT(DISTINCT user_id) as total FROM sync_lkh 
        WHERE is_deleted = false 
        AND tanggal = $1
      `, [getTodayStr()]),
    ]);

    // Guru yang sudah sync (punya data profil di server)
    const syncedResult = await query('SELECT COUNT(*) as total FROM sync_profil');

    // Ambil 5 user dengan LKH terbanyak bulan ini
    const topUsersResult = await query(`
      SELECT u.id, u.nama, u.nip, COUNT(l.id) as lkh_count
      FROM users u
      LEFT JOIN sync_lkh l ON l.user_id = u.id AND l.is_deleted = false AND l.updated_at > $1
      WHERE u.role = 'guru'
      GROUP BY u.id, u.nama, u.nip
      ORDER BY lkh_count DESC
      LIMIT 5
    `, [getStartOfMonth()]);

    res.json({
      success: true,
      data: {
        totalGuru: parseInt(usersResult.rows[0].total),
        totalGuruSynced: parseInt(syncedResult.rows[0].total),
        totalLkhBulanIni: parseInt(lkhResult.rows[0].total),
        guruAktifHariIni: parseInt(lkhTodayResult.rows[0].total),
        topUsers: topUsersResult.rows.map(r => ({
          id: r.id,
          nama: r.nama,
          nip: r.nip,
          lkhCount: parseInt(r.lkh_count),
        })),
      },
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Gagal memuat statistik.' });
  }
}

/**
 * GET /api/admin/users
 * Daftar semua guru dengan ringkasan data sync.
 */
export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const result = await query(`
      SELECT 
        u.id, u.nip, u.nama, u.role, u.created_at,
        sp.jabatan, sp.pangkat, sp.golongan,
        (SELECT COUNT(*) FROM sync_lkh WHERE user_id = u.id AND is_deleted = false) as total_lkh,
        (SELECT COUNT(*) FROM sync_jadwal WHERE user_id = u.id AND is_deleted = false) as total_jadwal,
        (SELECT MAX(updated_at) FROM sync_lkh WHERE user_id = u.id) as last_lkh_sync
      FROM users u
      LEFT JOIN sync_profil sp ON sp.user_id = u.id
      WHERE u.role = 'guru'
      ORDER BY u.nama ASC
    `);

    res.json({
      success: true,
      data: result.rows.map(r => ({
        id: r.id,
        nip: r.nip,
        nama: r.nama,
        jabatan: r.jabatan || '-',
        pangkat: r.pangkat || '-',
        golongan: r.golongan || '-',
        totalLkh: parseInt(r.total_lkh),
        totalJadwal: parseInt(r.total_jadwal),
        lastLkhSync: r.last_lkh_sync ? Number(r.last_lkh_sync) : null,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('❌ Admin users error:', error);
    res.status(500).json({ success: false, error: 'Gagal memuat daftar guru.' });
  }
}

/**
 * GET /api/admin/users/:id
 * Detail data seorang guru beserta semua LKH-nya untuk bulan tertentu.
 * Query params: ?month=0-11&year=2026
 */
export async function getUserDetail(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id);
    const month = parseInt(req.query.month as string ?? new Date().getMonth().toString());
    const year = parseInt(req.query.year as string ?? new Date().getFullYear().toString());

    // Ambil profil guru
    const profilResult = await query(`
      SELECT u.id, u.nip, u.nama, u.created_at,
             sp.jabatan, sp.pangkat, sp.golongan, sp.nama_kepsek, sp.nip_kepsek
      FROM users u
      LEFT JOIN sync_profil sp ON sp.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    if (profilResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Guru tidak ditemukan.' });
      return;
    }

    // Hitung range tanggal untuk bulan yang diminta
    const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const endMonth = month === 11 ? 1 : month + 2;
    const endYear = month === 11 ? year + 1 : year;
    const endDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-01`;

    // Ambil LKH bulan tersebut
    const lkhResult = await query(`
      SELECT client_id, tanggal, kegiatan, uraian, keterangan_output, tipe_sumber
      FROM sync_lkh 
      WHERE user_id = $1 AND is_deleted = false
      AND tanggal >= $2 AND tanggal < $3
      ORDER BY tanggal ASC
    `, [userId, startDate, endDate]);

    // Ambil jadwal
    const jadwalResult = await query(`
      SELECT hari, jam_mulai, jam_selesai, mata_pelajaran, kelas, ruangan
      FROM sync_jadwal
      WHERE user_id = $1 AND is_deleted = false
      ORDER BY hari, jam_mulai
    `, [userId]);

    const profil = profilResult.rows[0];

    res.json({
      success: true,
      data: {
        profil: {
          id: profil.id,
          nip: profil.nip,
          nama: profil.nama,
          jabatan: profil.jabatan || '-',
          pangkat: profil.pangkat || '-',
          golongan: profil.golongan || '-',
          namaKepsek: profil.nama_kepsek || '-',
          nipKepsek: profil.nip_kepsek || '-',
          createdAt: profil.created_at,
        },
        lkh: lkhResult.rows.map(r => ({
          tanggal: r.tanggal,
          kegiatan: r.kegiatan,
          uraian: r.uraian,
          keteranganOutput: r.keterangan_output,
          tipeSumber: r.tipe_sumber,
        })),
        jadwal: jadwalResult.rows.map(r => ({
          hari: r.hari,
          jamMulai: r.jam_mulai,
          jamSelesai: r.jam_selesai,
          mataPelajaran: r.mata_pelajaran,
          kelas: r.kelas,
          ruangan: r.ruangan,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Admin user detail error:', error);
    res.status(500).json({ success: false, error: 'Gagal memuat detail guru.' });
  }
}

// =============================================
// Helpers
// =============================================

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getStartOfMonth(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
