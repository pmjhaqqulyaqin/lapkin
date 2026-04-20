import Dexie, { type EntityTable } from 'dexie';

// --- Interfaces (Types) ---

export interface Profil {
  id: number; // Always 1 since it's personal
  nama: string;
  nip: string;
  jabatan: string;
  pangkat: string;
  golongan: string;
  namaKepsek: string;
  nipKepsek: string;
  ttdUrl?: string; // Data URL for offline image
  avatarUrl?: string; // Foto profil avatar
  updatedAt?: number; // Epoch ms — for sync tracking
}

export interface Jadwal {
  id?: number;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamMulai: string; // e.g., "08:00"
  jamSelesai: string; // e.g., "09:30"
  mataPelajaran: string;
  kelas: string;
  ruangan?: string;
  warna?: string;
  updatedAt?: number; // Epoch ms — for sync tracking
  isDeleted?: boolean; // Soft delete for sync
}

export interface TemplateTugas {
  hari: string;
  uraian: string[];
}

export interface TugasTambahan {
  id?: number;
  namaTugas: string;
  kategori: string;
  hariRutin?: string | string[]; // Legacy
  deskripsiLkh?: string | string[]; // Legacy
  templates?: TemplateTugas[]; // New structure: mapping of day to array of descriptions
  isDraft: boolean;
  updatedAt?: number; // Epoch ms — for sync tracking
  isDeleted?: boolean; // Soft delete for sync
}

export interface LaporanHarian {
  id?: number;
  tanggal: string; // YYYY-MM-DD
  kegiatan: string;
  uraian: string;
  keteranganOutput?: string;
  sumberId?: number; // ID Jadwal or TugasTambahan (if auto-populated)
  tipeSumber: 'manual' | 'jadwal' | 'tugas_tambahan';
  createdAt: number;
  updatedAt?: number; // Epoch ms — for sync tracking
  isDeleted?: boolean; // Soft delete for sync
}

export interface KalenderAkademik {
  id?: number;
  tanggal: string; // YYYY-MM-DD
  status: string; // Custom status from store
  keterangan: string;
  updatedAt?: number; // Epoch ms — for sync tracking
  isDeleted?: boolean; // Soft delete for sync
}

// --- Database Setup ---
const db = new Dexie('LaporanKinerjaDigitalDB') as Dexie & {
  profil: EntityTable<Profil, 'id'>;
  jadwal: EntityTable<Jadwal, 'id'>;
  tugasTambahan: EntityTable<TugasTambahan, 'id'>;
  lkh: EntityTable<LaporanHarian, 'id'>;
  kalender: EntityTable<KalenderAkademik, 'id'>;
};

// Schema declaration
db.version(1).stores({
  profil: 'id', // Primary key is 'id'
  jadwal: '++id, hari', // auto-increment primary key, index on 'hari'
  tugasTambahan: '++id, kategori, isDraft', 
  lkh: '++id, tanggal, tipeSumber', // index on tanggal for fast querying per month
});

db.version(2).stores({
  kalender: '++id, tanggal',
});

// Version 3: Add updatedAt index for sync filtering
db.version(3).stores({
  profil: 'id',
  jadwal: '++id, hari, updatedAt',
  tugasTambahan: '++id, kategori, isDraft, updatedAt',
  lkh: '++id, tanggal, tipeSumber, updatedAt',
  kalender: '++id, tanggal, updatedAt',
}).upgrade(tx => {
  // Migrasi data lama: set updatedAt = 0 untuk semua record yang belum punya
  const now = 0; // Data lama dianggap timestamp 0 agar bisa di-push saat sync pertama
  return Promise.all([
    tx.table('profil').toCollection().modify(item => {
      if (!item.updatedAt) item.updatedAt = now;
    }),
    tx.table('jadwal').toCollection().modify(item => {
      if (!item.updatedAt) item.updatedAt = now;
    }),
    tx.table('tugasTambahan').toCollection().modify(item => {
      if (!item.updatedAt) item.updatedAt = now;
    }),
    tx.table('lkh').toCollection().modify(item => {
      if (!item.updatedAt) item.updatedAt = now;
    }),
    tx.table('kalender').toCollection().modify(item => {
      if (!item.updatedAt) item.updatedAt = now;
    }),
  ]);
});

export { db };
