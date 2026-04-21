import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[200] bg-amber-500 text-white text-[11px] font-bold py-1 px-4 text-center shadow-md animate-slide-in-top flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[14px]">wifi_off</span>
      Anda sedang offline. Perubahan akan disimpan secara lokal.
    </div>
  );
}
