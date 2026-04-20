import { Request, Response } from 'express';
import { query } from '../config/database.js';

// POST /api/admin/kalender
export const addKalender = async (req: Request, res: Response) => {
  try {
    const { tanggal_mulai, tanggal_selesai, status, keterangan } = req.body;
    
    if (!tanggal_mulai || !tanggal_selesai || !status) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const result = await query(
      'INSERT INTO master_kalender (tanggal_mulai, tanggal_selesai, status, keterangan) VALUES ($1, $2, $3, $4) RETURNING *',
      [tanggal_mulai, tanggal_selesai, status, keterangan || '']
    );

    res.status(201).json({
      success: true,
      message: 'Jadwal kalender berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error adding kalender:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PUT /api/admin/kalender/:id
export const updateKalender = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tanggal_mulai, tanggal_selesai, status, keterangan } = req.body;

    if (!tanggal_mulai || !tanggal_selesai || !status) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const result = await query(
      'UPDATE master_kalender SET tanggal_mulai = $1, tanggal_selesai = $2, status = $3, keterangan = $4 WHERE id = $5 RETURNING *',
      [tanggal_mulai, tanggal_selesai, status, keterangan || '', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Jadwal berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating kalender:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// DELETE /api/admin/kalender/:id
export const deleteKalender = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM master_kalender WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Jadwal berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting kalender:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
