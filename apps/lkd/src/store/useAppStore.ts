import { create } from 'zustand';

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
  pullReferensiData: () => Promise<void>;
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
    localStorage.setItem('lkd_kegiatan_manual', JSON.stringify(list));
    set({ kegiatanManual: list });
  },
  setKategoriTugas: (list) => {
    localStorage.setItem('lkd_kategori_tugas', JSON.stringify(list));
    set({ kategoriTugas: list });
  },
  setStatusKalender: (list) => {
    localStorage.setItem('lkd_status_kalender', JSON.stringify(list));
    set({ statusKalender: list });
  },
  pullReferensiData: async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/referensi`);
      if (!res.ok) throw new Error('Gagal menarik data');
      const data = await res.json();
      if (data.success) {
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
      }
    } catch (err) {
      console.error('Error pulling referensi:', err);
    }
  },
}));
