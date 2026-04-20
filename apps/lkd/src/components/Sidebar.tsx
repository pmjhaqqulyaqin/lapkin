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
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div className="fixed top-0 left-0 bottom-0 w-60 bg-white dark:bg-slate-900 shadow-2xl z-[110] flex flex-col transform transition-transform animate-slide-in-left">
        {/* Header */}
        <div className="px-4 py-3.5 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              <img alt="Avatar" className="w-full h-full object-cover" src={profil?.avatarUrl || `https://ui-avatars.com/api/?name=${profil?.nama || 'G'}&background=0D9488&color=fff&size=64`} />
            </div>
            <div className="min-w-0">
              {profil ? (
                <>
                  <h2 className="font-manrope font-bold text-[14px] text-slate-800 dark:text-slate-100 truncate">{profil.nama}</h2>
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{profil.jabatan || 'Guru'}</p>
                </>
              ) : (
                <>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-2">
            <li>
              <NavLink to="/kalender" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_month</span>
                Kalender Akademik
              </NavLink>
            </li>
            <li>
              <NavLink to="/tugas" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px] text-slate-400">assignment_ind</span>
                Tugas Tambahan
              </NavLink>
            </li>
            <li>
              <NavLink to="/lkh/riwayat" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px] text-slate-400">history</span>
                Riwayat LKH
              </NavLink>
            </li>
            <li>
              <button onClick={() => { useAppStore.getState().setBantuanOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px] text-slate-400">help</span>
                Bantuan & Panduan
              </button>
            </li>
            <li className="my-1.5 border-t border-slate-100 dark:border-slate-800"></li>
            <li>
              <button onClick={() => { setSidebarOpen(false); logout(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Keluar Aplikasi
              </button>
            </li>
          </ul>
        </div>
        
        <div className="p-3 text-center text-[9px] font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-800">
          LKD App v1.0.0 &copy; 2026 MAN 2 Lotim
        </div>
      </div>
    </>
  );
}
