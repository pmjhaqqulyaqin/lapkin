import { NavLink } from 'react-router-dom';

export default function BottomNav({ isEditorPage }: { isEditorPage?: boolean }) {
  const containerClass = `fixed bottom-0 w-full z-50 pb-safe bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,34,44,0.06)] flex justify-around items-center h-20 px-2 transition-transform duration-300 ${isEditorPage ? 'translate-y-full md:translate-y-0' : 'translate-y-0'}`;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex flex-col items-center justify-center bg-teal-950 text-white dark:bg-teal-100 dark:text-teal-950 rounded-xl px-4 py-1.5 duration-300 ease-out no-print'
      : 'flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-1.5 duration-300 ease-out hover:text-teal-800 dark:hover:text-teal-200 no-print';

  return (
    <nav className={containerClass}>
      <NavLink to="/dashboard" className={navItemClass}>
        {({ isActive }) => (
          <>
            <span className="material-symbols-outlined mb-1" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
              home
            </span>
            <span className="font-inter text-[10px] font-semibold uppercase tracking-widest mt-1">Home</span>
          </>
        )}
      </NavLink>
      <NavLink to="/lkh/input" className={navItemClass}>
        {({ isActive }) => (
          <>
            <span className="material-symbols-outlined mb-1" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
              edit_document
            </span>
            <span className="font-inter text-[10px] font-semibold uppercase tracking-widest mt-1">Input LKH</span>
          </>
        )}
      </NavLink>
      <NavLink to="/jadwal" className={navItemClass}>
        {({ isActive }) => (
          <>
            <span className="material-symbols-outlined mb-1" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
              calendar_month
            </span>
            <span className="font-inter text-[10px] font-semibold uppercase tracking-widest mt-1">Jadwal</span>
          </>
        )}
      </NavLink>
      <NavLink to="/profil" className={navItemClass}>
        {({ isActive }) => (
          <>
            <span className="material-symbols-outlined mb-1" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
              account_circle
            </span>
            <span className="font-inter text-[10px] font-semibold uppercase tracking-widest mt-1">Profil</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
