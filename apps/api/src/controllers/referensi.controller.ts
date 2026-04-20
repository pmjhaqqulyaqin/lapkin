import { Request, Response } from 'express';
import { query } from '../config/database.js';

// GET /api/referensi
// Mengambil semua data referensi (dibagi per jenis)
export const getAllReferensi = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM master_referensi ORDER BY jenis, id ASC');
    const kalenderResult = await query('SELECT * FROM master_kalender ORDER BY tanggal_mulai ASC');
    
    // Grouping by jenis
    const referensi = {
      kegiatan: [] as string[],
      tugas: [] as string[],
      kalender: [] as string[],
      jadwal_kalender: kalenderResult.rows
    };

    result.rows.forEach(row => {
      if (row.jenis === 'kegiatan') referensi.kegiatan.push(row.nilai);
      else if (row.jenis === 'tugas') referensi.tugas.push(row.nilai);
      else if (row.jenis === 'kalender') referensi.kalender.push(row.nilai);
    });

    // We also want to return the raw items so Admin dashboard can edit/delete by ID
    res.json({
      success: true,
      data: referensi,
      raw: result.rows
    });
  } catch (error) {
    console.error('Error fetching referensi:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// POST /api/referensi
// Menambahkan referensi baru (Hanya Admin)
export const addReferensi = async (req: Request, res: Response) => {
  try {
    const { nilai, jenis } = req.body;
    
    if (!nilai || !jenis) {
      return res.status(400).json({ success: false, message: 'Nilai dan jenis harus diisi' });
    }

    if (!['kegiatan', 'tugas', 'kalender'].includes(jenis)) {
      return res.status(400).json({ success: false, message: 'Jenis referensi tidak valid' });
    }

    const result = await query(
      'INSERT INTO master_referensi (nilai, jenis) VALUES ($1, $2) RETURNING *',
      [nilai, jenis]
    );

    res.status(201).json({
      success: true,
      message: 'Referensi berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error adding referensi:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ success: false, message: 'Nilai referensi tersebut sudah ada di jenis ini' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PUT /api/referensi/:id
// Mengedit referensi yang ada (Hanya Admin)
export const updateReferensi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nilai } = req.body;

    if (!nilai) {
      return res.status(400).json({ success: false, message: 'Nilai referensi harus diisi' });
    }

    const result = await query(
      'UPDATE master_referensi SET nilai = $1 WHERE id = $2 RETURNING *',
      [nilai, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Referensi tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Referensi berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating referensi:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Nilai referensi tersebut sudah ada' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// DELETE /api/referensi/:id
// Menghapus referensi (Hanya Admin)
export const deleteReferensi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM master_referensi WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Referensi tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Referensi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting referensi:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
