import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Mendaftarkan pengguna baru untuk sinkronisasi.
 * Body: { nip, nama, password }
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { nip, nama, password } = req.body;

    // Validasi input
    if (!nip || !nama || !password) {
      res.status(400).json({
        success: false,
        error: 'NIP, Nama, dan Password wajib diisi.',
      });
      return;
    }

    if (password.length < 4) {
      res.status(400).json({
        success: false,
        error: 'Password minimal 4 karakter.',
      });
      return;
    }

    // Cek apakah NIP sudah terdaftar
    const existing = await query('SELECT id FROM users WHERE nip = $1', [nip]);
    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'NIP sudah terdaftar. Silakan login.',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = await query(
      'INSERT INTO users (nip, nama, password_hash) VALUES ($1, $2, $3) RETURNING id, nip, nama',
      [nip, nama, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.nip);

    console.log(`✅ User terdaftar: ${user.nama} (NIP: ${user.nip})`);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server saat registrasi.',
    });
  }
}

/**
 * POST /api/auth/login
 * Login pengguna untuk mendapatkan token sinkronisasi.
 * Body: { nip, password }
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { nip, password } = req.body;

    // Validasi input
    if (!nip || !password) {
      res.status(400).json({
        success: false,
        error: 'NIP dan Password wajib diisi.',
      });
      return;
    }

    // Cari user berdasarkan NIP
    const result = await query(
      'SELECT id, nip, nama, password_hash FROM users WHERE nip = $1',
      [nip]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'NIP tidak ditemukan. Silakan daftar terlebih dahulu.',
      });
      return;
    }

    const user = result.rows[0];

    // Verifikasi password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Password salah.',
      });
      return;
    }

    const token = generateToken(user.id, user.nip);

    console.log(`🔑 User login: ${user.nama} (NIP: ${user.nip})`);

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server saat login.',
    });
  }
}

/**
 * GET /api/auth/me
 * Mendapatkan info user dari token (untuk verifikasi token masih valid).
 * Header: Authorization: Bearer <token>
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      'SELECT id, nip, nama, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User tidak ditemukan.',
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Me error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server.',
    });
  }
}
