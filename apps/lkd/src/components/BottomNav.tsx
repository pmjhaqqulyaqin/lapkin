import { NavLink } from 'react-router-dom';

export default function BottomNav({ isEditorPage }: { isEditorPage?: boolean }) {
  const containerClass = `fixed bottom-0 w-full z-50 pb-safe bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex justify-around items-center h-[70px] px-2 transition-transform duration-300 md:hidden ${isEditorPage ? 'translate-y-full md:translate-y-0' : 'translate-y-0'}`;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex flex-col items-center justify-center text-teal-600 dark:text-teal-400 px-2 py-1 duration-300 ease-out no-print scale-105'
      : 'flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-2 py-1 duration-300 ease-out hover:text-teal-600 dark:hover:text-teal-400 no-print hover:scale-105';

  return (
    <nav className={containerClass}>
      <NavLink to="/dashboard" className={navItemClass}>
        {({ isActive }) => (
          <>
            <div className={`w-12 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors ${isActive ? 'bg-teal-100 dark:bg-teal-900/40' : ''}`}>
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                home
              </span>
            </div>
            <span className="font-inter text-[10px] font-semibold tracking-wide">Beranda</span>
          </>
        )}
      </NavLink>
      <NavLink to="/jadwal" className={navItemClass}>
        {({ isActive }) => (
          <>
            <div className={`w-12 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors ${isActive ? 'bg-teal-100 dark:bg-teal-900/40' : ''}`}>
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                calendar_month
              </span>
            </div>
            <span className="font-inter text-[10px] font-semibold tracking-wide">Jadwal</span>
          </>
        )}
      </NavLink>
      
      {/* Center FAB Style Button */}
      <div className="relative -top-5">
        <NavLink to="/lkh/input" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-teal-500/30 transition-transform active:scale-95 text-white ${isActive ? 'bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'}`}>
          <span className="material-symbols-outlined text-[28px]">
            add
          </span>
        </NavLink>
      </div>

      <NavLink to="/lkh/riwayat" className={navItemClass}>
        {({ isActive }) => (
          <>
            <div className={`w-12 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors ${isActive ? 'bg-teal-100 dark:bg-teal-900/40' : ''}`}>
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                history
              </span>
            </div>
            <span className="font-inter text-[10px] font-semibold tracking-wide">Riwayat</span>
          </>
        )}
      </NavLink>
      <NavLink to="/profil" className={navItemClass}>
        {({ isActive }) => (
          <>
            <div className={`w-12 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors ${isActive ? 'bg-teal-100 dark:bg-teal-900/40' : ''}`}>
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                person
              </span>
            </div>
            <span className="font-inter text-[10px] font-semibold tracking-wide">Profil</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
