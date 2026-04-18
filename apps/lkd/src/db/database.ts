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
}

export interface KalenderAkademik {
  id?: number;
  tanggal: string; // YYYY-MM-DD
  status: 'masuk' | 'libur' | 'kegiatan';
  keterangan: string;
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

export { db };
