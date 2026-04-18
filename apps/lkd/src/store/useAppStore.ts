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
  toast: Toast;
  
  // Actions
  login: () => void;
  logout: () => void;
  toggleDarkMode: () => void;
  setActiveMonthYear: (month: number, year: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initialize from localStorage if available
  isLoggedIn: localStorage.getItem('lkd_logged_in') === 'true',
  isDarkMode: localStorage.getItem('lkd_dark_mode') === 'true',
  activeMonthIndex: new Date().getMonth(),
  activeYear: new Date().getFullYear(),
  isSidebarOpen: false,
  toast: { message: '', type: 'info', visible: false },

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
}));
