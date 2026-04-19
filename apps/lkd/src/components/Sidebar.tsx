import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export default function Sidebar() {
  const { isSidebarOpen, setSidebarOpen, logout } = useAppStore();
  const profil = useLiveQuery(() => db.profil.get(1));

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-[110] flex flex-col transform transition-transform animate-slide-in-left">
        {/* Header / Profile */}
        <div className="p-6 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-900/30">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden mb-4">
            <img
              alt="Teacher Profile Avatar"
              className="w-full h-full object-cover"
              src={profil?.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'Guru'}&background=0D9488&color=fff`}
            />
          </div>
          {profil ? (
            <>
              <h2 className="font-manrope font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">{profil.nama}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{profil.jabatan || 'Guru'}</p>
            </>
          ) : (
            <>
              <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1.5"></div>
            </>
          )}
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 w-max px-2.5 py-1 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
            Tersinkronisasi Lokal
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <NavLink 
                to="/kalender" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                Kalender Akademik
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/tugas" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">assignment_ind</span>
                Tugas Tambahan
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/lkh/riwayat" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">history</span>
                Riwayat LKH
              </NavLink>
            </li>
            <li>
              <button 
                onClick={() => {
                  useAppStore.getState().setBantuanOpen(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">help</span>
                Bantuan & Panduan
              </button>
            </li>
            <li className="my-2 border-t border-slate-100 dark:border-slate-800"></li>
            <li>
              <button 
                onClick={() => {
                  setSidebarOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                Keluar Aplikasi
              </button>
            </li>
          </ul>
        </div>
        
        {/* Footer */}
        <div className="p-4 text-center text-[10px] font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-800">
          LKD App v1.0.0 &copy; 2026 MAN 2 Lotim
        </div>
      </div>
    </>
  );
}
