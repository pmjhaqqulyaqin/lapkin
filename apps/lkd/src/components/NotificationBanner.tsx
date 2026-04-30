import { useNavigate } from 'react-router-dom';
import { useLkhNotification } from '../hooks/useLkhNotification';
import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const navigate = useNavigate();
  const {
    notifications,
    dismissToday,
    dismissMissed,
    requestNotificationPermission,
    notificationPermission,
  } = useLkhNotification();

  // Track which banners are animating out
  const [fadingOut, setFadingOut] = useState<Record<string, boolean>>({});

  // Request notification permission on mount (hanya prompt sekali)
  const [hasRequestedPerm, setHasRequestedPerm] = useState(
    () => localStorage.getItem('lkd_notif_perm_asked') === 'true'
  );

  useEffect(() => {
    if (!hasRequestedPerm && notificationPermission === 'default' && notifications.length > 0) {
      // Delay sedikit agar tidak langsung muncul saat load
      const timer = setTimeout(() => {
        requestNotificationPermission();
        localStorage.setItem('lkd_notif_perm_asked', 'true');
        setHasRequestedPerm(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasRequestedPerm, notificationPermission, notifications.length, requestNotificationPermission]);

  if (notifications.length === 0) return null;

  const handleDismiss = (type: 'today' | 'missed') => {
    setFadingOut(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      if (type === 'today') dismissToday();
      else dismissMissed();
    }, 300); // Match animation duration
  };

  const handleAction = (type: 'today' | 'missed', oldestDate?: string) => {
    if (type === 'today') {
      navigate('/lkh/input');
    } else if (oldestDate) {
      navigate('/lkh/input', { state: { date: oldestDate } });
    }
  };

  return (
    <div className="fixed bottom-[76px] md:bottom-4 left-0 right-0 z-[90] px-4 space-y-2 max-w-3xl mx-auto pointer-events-none" role="alert" aria-live="polite">
      {notifications.map((notif) => {
        const isToday = notif.type === 'today';
        const isFading = fadingOut[notif.type];

        return (
          <div
            key={notif.type}
            className={`
              rounded-2xl p-3.5 flex items-start gap-3 border shadow-sm transition-all duration-300 pointer-events-auto
              ${isFading ? 'animate-fade-out opacity-0 -translate-y-2' : 'animate-slide-down'}
              ${isToday
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/50 shadow-amber-100/50 dark:shadow-amber-900/20'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200/70 dark:border-red-800/50 shadow-red-100/50 dark:shadow-red-900/20'
              }
            `}
          >
            {/* Icon */}
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5
              ${isToday
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              }
            `}>
              <span className={`material-symbols-outlined text-[20px] ${isToday ? 'animate-gentle-pulse' : 'animate-gentle-shake'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                {isToday ? 'notifications_active' : 'warning'}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-bold leading-snug ${
                isToday 
                  ? 'text-amber-900 dark:text-amber-200' 
                  : 'text-red-900 dark:text-red-200'
              }`}>
                {notif.message}
              </p>

              {/* Missed count badge */}
              {!isToday && notif.missedCount && notif.missedCount > 5 && (
                <span className="inline-flex items-center gap-1 mt-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Perlu segera dilengkapi
                </span>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleAction(notif.type, notif.oldestMissed)}
                className={`
                  mt-2 text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-all active:scale-95
                  inline-flex items-center gap-1.5 shadow-sm
                  ${isToday
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  }
                `}
              >
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                {isToday ? 'Isi Sekarang' : 'Lengkapi'}
              </button>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => handleDismiss(notif.type)}
              className={`
                shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors mt-0.5
                ${isToday
                  ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                }
              `}
              title="Tutup"
              aria-label="Tutup notifikasi"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
