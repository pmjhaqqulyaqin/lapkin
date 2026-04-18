import { useAppStore } from '../store/useAppStore';

export default function Toast() {
  const { toast, hideToast } = useAppStore();

  if (!toast.visible) return null;

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-teal-800'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 w-max max-w-[90vw]`}>
        <span className="material-symbols-outlined">{icons[toast.type]}</span>
        <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        <button onClick={hideToast} className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors opacity-80 hover:opacity-100 flex items-center">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
