/**
 * LKD Sync Engine
 * Mengelola sinkronisasi data antara Dexie (IndexedDB) dan server API.
 * Strategi: Offline-First dengan Last-Write-Wins (LWW).
 */

import { db } from './database.js';

// API Base URL — configurable via environment variable
const API_BASE = import.meta.env.VITE_API_URL || '';

// =============================================
// Types
// =============================================

export interface SyncAuthData {
  userId: number;
  nip: string;
  nama: string;
  token: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncResult {
  success: boolean;
  message: string;
  pushed: number;
  pulled: number;
}

// =============================================
// Auth Functions
// =============================================

/**
 * Register a new sync account on the server.
 */
export async function syncRegister(nip: string, nama: string, password: string): Promise<SyncAuthData> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nip, nama, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mendaftar.');

  const authData: SyncAuthData = data.data;
  saveSyncAuth(authData);
  return authData;
}

/**
 * Login to the sync server.
 */
export async function syncLogin(nip: string, password: string): Promise<SyncAuthData> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nip, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal login.');

  const authData: SyncAuthData = data.data;
  saveSyncAuth(authData);
  return authData;
}

/**
 * Verify if the current token is still valid.
 */
export async function verifySyncToken(): Promise<boolean> {
  const token = getSyncToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// =============================================
// Sync Functions
// =============================================

/**
 * Full sync: PUSH local changes to server, then PULL server changes to local.
 */
export async function fullSync(): Promise<SyncResult> {
  const token = getSyncToken();
  if (!token) throw new Error('Anda belum login ke server sinkronisasi.');

  if (!navigator.onLine) {
    throw new Error('Tidak ada koneksi internet.');
  }

  const pushResult = await pushToServer(token);
  const pullResult = await pullFromServer(token);

  // Update last sync timestamp
  const serverTimestamp = Math.max(pushResult.serverTimestamp, pullResult.serverTimestamp);
  localStorage.setItem('lkd_last_sync', String(serverTimestamp));
  localStorage.setItem('lkd_last_sync_date', new Date().toISOString());

  return {
    success: true,
    message: 'Sinkronisasi berhasil!',
    pushed: pushResult.count,
    pulled: pullResult.count,
  };
}

/**
 * PUSH: Upload all locally-changed data to the server.
 */
async function pushToServer(token: string): Promise<{ serverTimestamp: number; count: number }> {
  const lastSync = getLastSyncTimestamp();

  // Gather all data that changed since last sync
  const profil = await db.profil.get(1);
  const jadwal = await db.jadwal.toArray().then(arr =>
    arr.filter(j => (j.updatedAt || 0) > lastSync)
  );
  const tugasTambahan = await db.tugasTambahan.toArray().then(arr =>
    arr.filter(t => (t.updatedAt || 0) > lastSync)
  );
  const lkh = await db.lkh.toArray().then(arr =>
    arr.filter(l => (l.updatedAt || 0) > lastSync)
  );
  const kalender = await db.kalender.toArray().then(arr =>
    arr.filter(k => (k.updatedAt || 0) > lastSync)
  );

  // Only push profil if it changed
  const profilPayload = profil && (profil.updatedAt || 0) > lastSync ? profil : undefined;

  const totalItems = (profilPayload ? 1 : 0) + jadwal.length + tugasTambahan.length + lkh.length + kalender.length;

  if (totalItems === 0) {
    return { serverTimestamp: Date.now(), count: 0 };
  }

  const res = await fetch(`${API_BASE}/api/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      profil: profilPayload,
      jadwal,
      tugasTambahan,
      lkh,
      kalender,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mengirim data ke server.');

  return { serverTimestamp: data.serverTimestamp, count: totalItems };
}

/**
 * PULL: Download server changes and merge into local Dexie.
 */
async function pullFromServer(token: string): Promise<{ serverTimestamp: number; count: number }> {
  const lastSync = getLastSyncTimestamp();

  const res = await fetch(`${API_BASE}/api/sync/pull`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ since: String(lastSync) }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mengambil data dari server.');

  const serverData = data.data;
  let totalMerged = 0;

  // Merge into Dexie using a transaction
  await db.transaction('rw', [db.profil, db.jadwal, db.lkh, db.tugasTambahan, db.kalender], async () => {

    // 1. Merge Profil
    if (serverData.profil) {
      const local = await db.profil.get(1);
      if (!local || (serverData.profil.updatedAt || 0) > (local.updatedAt || 0)) {
        await db.profil.put({ ...serverData.profil, id: 1 });
        totalMerged++;
      }
    }

    // 2. Merge Jadwal
    for (const item of serverData.jadwal || []) {
      const localId = item.clientId;
      const local = await db.jadwal.get(localId);

      if (item.isDeleted) {
        if (local) {
          await db.jadwal.update(localId, { isDeleted: true, updatedAt: item.updatedAt });
        }
      } else if (!local || (item.updatedAt || 0) > (local.updatedAt || 0)) {
        await db.jadwal.put({
          id: localId,
          hari: item.hari,
          jamMulai: item.jamMulai,
          jamSelesai: item.jamSelesai,
          mataPelajaran: item.mataPelajaran,
          kelas: item.kelas,
          ruangan: item.ruangan,
          warna: item.warna,
          updatedAt: item.updatedAt,
          isDeleted: false,
        });
      }
      totalMerged++;
    }

    // 3. Merge Tugas Tambahan
    for (const item of serverData.tugasTambahan || []) {
      const localId = item.clientId;
      const local = await db.tugasTambahan.get(localId);

      if (item.isDeleted) {
        if (local) {
          await db.tugasTambahan.update(localId, { isDeleted: true, updatedAt: item.updatedAt });
        }
      } else if (!local || (item.updatedAt || 0) > (local.updatedAt || 0)) {
        await db.tugasTambahan.put({
          id: localId,
          namaTugas: item.namaTugas,
          kategori: item.kategori,
          templates: item.templates,
          isDraft: item.isDraft,
          updatedAt: item.updatedAt,
          isDeleted: false,
        });
      }
      totalMerged++;
    }

    // 4. Merge LKH
    for (const item of serverData.lkh || []) {
      const localId = item.clientId;
      const local = await db.lkh.get(localId);

      if (item.isDeleted) {
        if (local) {
          await db.lkh.update(localId, { isDeleted: true, updatedAt: item.updatedAt });
        }
      } else if (!local || (item.updatedAt || 0) > (local.updatedAt || 0)) {
        await db.lkh.put({
          id: localId,
          tanggal: item.tanggal,
          kegiatan: item.kegiatan,
          uraian: item.uraian,
          keteranganOutput: item.keteranganOutput,
          sumberId: item.sumberId,
          tipeSumber: item.tipeSumber,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          isDeleted: false,
        });
      }
      totalMerged++;
    }

    // 5. Merge Kalender
    for (const item of serverData.kalender || []) {
      const localId = item.clientId;
      const local = await db.kalender.get(localId);

      if (item.isDeleted) {
        if (local) {
          await db.kalender.update(localId, { isDeleted: true, updatedAt: item.updatedAt });
        }
      } else if (!local || (item.updatedAt || 0) > (local.updatedAt || 0)) {
        await db.kalender.put({
          id: localId,
          tanggal: item.tanggal,
          status: item.status,
          keterangan: item.keterangan,
          updatedAt: item.updatedAt,
          isDeleted: false,
        });
      }
      totalMerged++;
    }
  });

  return { serverTimestamp: data.serverTimestamp, count: totalMerged };
}

// =============================================
// Helper Functions
// =============================================

function saveSyncAuth(authData: SyncAuthData) {
  localStorage.setItem('lkd_sync_token', authData.token);
  localStorage.setItem('lkd_sync_user', JSON.stringify({
    userId: authData.userId,
    nip: authData.nip,
    nama: authData.nama,
  }));
}

export function getSyncToken(): string | null {
  return localStorage.getItem('lkd_sync_token');
}

export function getSyncUser(): { userId: number; nip: string; nama: string } | null {
  const raw = localStorage.getItem('lkd_sync_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getLastSyncTimestamp(): number {
  return parseInt(localStorage.getItem('lkd_last_sync') || '0', 10);
}

export function getLastSyncDate(): string | null {
  return localStorage.getItem('lkd_last_sync_date');
}

export function clearSyncAuth() {
  localStorage.removeItem('lkd_sync_token');
  localStorage.removeItem('lkd_sync_user');
  localStorage.removeItem('lkd_last_sync');
  localStorage.removeItem('lkd_last_sync_date');
}

export function isSyncConfigured(): boolean {
  return !!getSyncToken();
}
