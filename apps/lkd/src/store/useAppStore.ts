import { create } from 'zustand';
import { db } from '../db/database';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface AppState {
  isLoggedIn: boolean;
  isDarkMode: boolean;
  activeMonthIndex: number; // 0-11
  activeYear: number;
  isSidebarOpen: boolean;
  isBantuanOpen: boolean;
  toast: Toast;
  
  // Custom Lists
  kegiatanManual: string[];
  kategoriTugas: string[];
  statusKalender: string[];
  
  // Pegawai Lists
  unitKerjaList: string[];
  namaShiftList: string[];
  jamKerjaTetap: { mulai: string; selesai: string };
  
  // Actions
  login: () => void;
  logout: () => void;
  toggleDarkMode: () => void;
  setActiveMonthYear: (month: number, year: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setBantuanOpen: (isOpen: boolean) => void;
  setKegiatanManual: (list: string[]) => void;
  setKategoriTugas: (list: string[]) => void;
  setStatusKalender: (list: string[]) => void;
  setUnitKerjaList: (list: string[]) => void;
  setNamaShiftList: (list: string[]) => void;
  setJamKerjaTetap: (jam: { mulai: string; selesai: string }) => void;
  pullReferensiData: () => Promise<{kegiatan: number, tugas: number, kalender: number, jadwalKalender: number} | undefined>;
}

export const useAppStore = create<AppState>((set) => ({
  // Initialize from localStorage if available
  isLoggedIn: localStorage.getItem('lkd_logged_in') === 'true',
  isDarkMode: localStorage.getItem('lkd_dark_mode') === 'true',
  activeMonthIndex: new Date().getMonth(),
  activeYear: new Date().getFullYear(),
  isSidebarOpen: false,
  isBantuanOpen: false,
  toast: { message: '', type: 'info', visible: false },

  kegiatanManual: JSON.parse(localStorage.getItem('lkd_kegiatan_manual') || '["Rapat Sekolah", "Upacara Bendera", "Kegiatan IMTAQ", "Penyusunan Bahan Ajar", "Kegiatan Khusus", "Tugas Tambahan Lainnya..."]'),
  kategoriTugas: JSON.parse(localStorage.getItem('lkd_kategori_tugas') || '["Administrasi Kurikulum", "Wali Kelas", "Pembina Ekstrakurikuler", "Pengelola Perpustakaan", "Lainnya"]'),
  statusKalender: JSON.parse(localStorage.getItem('lkd_status_kalender') || '["Libur Nasional", "Kegiatan Khusus", "Cuti Bersama"]'),

  unitKerjaList: JSON.parse(localStorage.getItem('lkd_unit_kerja') || '["Tata Usaha", "Perpustakaan", "Keamanan", "Kebersihan", "Operator", "Lainnya"]'),
  namaShiftList: JSON.parse(localStorage.getItem('lkd_nama_shift') || '["Shift Pagi", "Shift Siang", "Piket Harian"]'),
  jamKerjaTetap: JSON.parse(localStorage.getItem('lkd_jam_kerja_tetap') || '{"mulai":"07:00","selesai":"15:30"}'),

  login: () => {
    localStorage.setItem('lkd_logged_in', 'true');
    set({ isLoggedIn: true });
  },
  
  logout: () => {
    localStorage.removeItem('lkd_logged_in');
    set({ isLoggedIn: false });
  },

  toggleDarkMode: () => set((state) => {
    const newVal = !state.isDarkMode;
    localStorage.setItem('lkd_dark_mode', String(newVal));
    if (newVal) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newVal };
  }),

  setActiveMonthYear: (month, year) => set({ activeMonthIndex: month, activeYear: year }),

  showToast: (message, type = 'success') => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => {
      set((state) => ({ toast: { ...state.toast, visible: false } }));
    }, 3000);
  },

  hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setBantuanOpen: (isOpen) => set({ isBantuanOpen: isOpen }),
  setKegiatanManual: (list) => {
    // Detect new items that weren't in the previous list
    const prevList: string[] = JSON.parse(localStorage.getItem('lkd_kegiatan_manual') || '[]');
    const newItems = list.filter(item => !prevList.includes(item));

    localStorage.setItem('lkd_kegiatan_manual', JSON.stringify(list));
    set({ kegiatanManual: list });

    // Push new items to server so other users can access them
    if (newItems.length > 0) {
      const token = localStorage.getItem('lkd_sync_token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      if (token && navigator.onLine) {
        fetch(`${API_BASE}/api/referensi/suggest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ items: newItems, jenis: 'kegiatan' }),
        }).catch(err => console.warn('Gagal sync opsi kegiatan ke server:', err));
      }
    }
  },
  setKategoriTugas: (list) => {
    // Detect new items that weren't in the previous list
    const prevList: string[] = JSON.parse(localStorage.getItem('lkd_kategori_tugas') || '[]');
    const newItems = list.filter(item => !prevList.includes(item));

    localStorage.setItem('lkd_kategori_tugas', JSON.stringify(list));
    set({ kategoriTugas: list });

    // Push new items to server so other users can access them
    if (newItems.length > 0) {
      const token = localStorage.getItem('lkd_sync_token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      if (token && navigator.onLine) {
        fetch(`${API_BASE}/api/referensi/suggest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ items: newItems, jenis: 'tugas' }),
        }).catch(err => console.warn('Gagal sync opsi tugas ke server:', err));
      }
    }
  },
  setStatusKalender: (list) => {
    // Detect new items that weren't in the previous list
    const prevList: string[] = JSON.parse(localStorage.getItem('lkd_status_kalender') || '[]');
    const newItems = list.filter(item => !prevList.includes(item));

    localStorage.setItem('lkd_status_kalender', JSON.stringify(list));
    set({ statusKalender: list });

    // Push new items to server so other users can access them
    if (newItems.length > 0) {
      const token = localStorage.getItem('lkd_sync_token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      if (token && navigator.onLine) {
        fetch(`${API_BASE}/api/referensi/suggest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ items: newItems, jenis: 'kalender' }),
        }).catch(err => console.warn('Gagal sync opsi kalender ke server:', err));
      }
    }
  },
  setUnitKerjaList: (list) => {
    localStorage.setItem('lkd_unit_kerja', JSON.stringify(list));
    set({ unitKerjaList: list });
  },
  setNamaShiftList: (list) => {
    localStorage.setItem('lkd_nama_shift', JSON.stringify(list));
    set({ namaShiftList: list });
  },
  setJamKerjaTetap: (jam) => {
    localStorage.setItem('lkd_jam_kerja_tetap', JSON.stringify(jam));
    set({ jamKerjaTetap: jam });
  },
  // Sync dark mode class on store creation (belt-and-suspenders with index.html script)
  ...((() => {
    const isDark = localStorage.getItem('lkd_dark_mode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return {};
  })()),

  pullReferensiData: async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/referensi`);
      if (!res.ok) throw new Error('Gagal menarik data');
      const data = await res.json();
      if (data.success) {
        // 1. Merge opsi referensi (kegiatan, tugas, status kalender)
        set((state) => {
          const mergedKegiatan = Array.from(new Set([...data.data.kegiatan, ...state.kegiatanManual]));
          const mergedTugas = Array.from(new Set([...data.data.tugas, ...state.kategoriTugas]));
          const mergedKalender = Array.from(new Set([...data.data.kalender, ...state.statusKalender]));
          
          localStorage.setItem('lkd_kegiatan_manual', JSON.stringify(mergedKegiatan));
          localStorage.setItem('lkd_kategori_tugas', JSON.stringify(mergedTugas));
          localStorage.setItem('lkd_status_kalender', JSON.stringify(mergedKalender));
          
          return {
            kegiatanManual: mergedKegiatan,
            kategoriTugas: mergedTugas,
            statusKalender: mergedKalender
          };
        });

        // 2. Sync jadwal kalender master ke Dexie (clear-and-replace for isGlobal=1)
        const jadwalKalender = data.data.jadwal_kalender || [];
        try {
          // Hapus semua data kalender global lama
          const globalEntries = await db.kalender.where('isGlobal').equals(1).toArray();
          const globalIds = globalEntries.map(e => e.id!).filter(Boolean);
          if (globalIds.length > 0) {
            await db.kalender.bulkDelete(globalIds);
          }

          // Masukkan data global terbaru dari server
          if (jadwalKalender.length > 0) {
            const newEntries: Array<{tanggal: string; status: string; keterangan: string; isGlobal: number; updatedAt: number}> = [];
            for (const jk of jadwalKalender) {
              // Expand rentang tanggal menjadi entry per hari
              const start = new Date(jk.tanggal_mulai);
              const end = new Date(jk.tanggal_selesai);
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                newEntries.push({
                  tanggal: dateStr,
                  status: jk.status,
                  keterangan: jk.keterangan || '',
                  isGlobal: 1,
                  updatedAt: Date.now(),
                });
              }
            }
            if (newEntries.length > 0) {
              await db.kalender.bulkAdd(newEntries);
            }
          }
        } catch (dbErr) {
          console.error('Error syncing jadwal kalender to Dexie:', dbErr);
        }
        
        return {
          kegiatan: data.data.kegiatan.length,
          tugas: data.data.tugas.length,
          kalender: data.data.kalender.length,
          jadwalKalender: jadwalKalender.length
        };
      }
    } catch (err) {
      console.error('Error pulling referensi:', err);
    }
    return undefined;
  },
}));
