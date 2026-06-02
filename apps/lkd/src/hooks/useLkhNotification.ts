import { useEffect, useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

/**
 * Hook headless (tanpa UI) untuk mengelola System Notification LKH.
 * 
 * Fungsi:
 * 1. Request izin notifikasi browser secara otomatis (sekali saja)
 * 2. Kirim notifikasi ke Service Worker saat tab menjadi hidden
 * 3. Register periodic background sync untuk notifikasi saat app tertutup
 * 
 * Hook ini TIDAK menampilkan apapun di dalam app.
 */

// --- Helpers ---
const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWorkingDaysBetween = (startDate: Date, endDate: Date): string[] => {
  const days: string[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    if (current.getDay() !== 0) { // Skip Minggu
      days.push(toDateStr(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export function useLkhNotification() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const todayStr = toDateStr(new Date());

  // 30 hari ke belakang
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = toDateStr(thirtyDaysAgo);

  // Query LKH dari 30 hari terakhir (live, reaktif)
  const recentLkh = useLiveQuery(
    () => db.lkh.where('tanggal')
      .between(thirtyDaysAgoStr, todayStr, true, true)
      .toArray()
      .then(arr => arr.filter(l => !l.isDeleted)),
    [thirtyDaysAgoStr, todayStr]
  );

  // Query kalender (libur & cuti) dari 30 hari terakhir
  const recentKalender = useLiveQuery(
    () => db.kalender.where('tanggal')
      .between(thirtyDaysAgoStr, todayStr, true, true)
      .toArray()
      .then(arr => arr.filter(k => !k.isDeleted)),
    [thirtyDaysAgoStr, todayStr]
  );

  // --- Request Notification Permission (otomatis, sekali saja) ---
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setPermissionState('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
    } catch {
      setPermissionState('denied');
    }
  }, []);

  useEffect(() => {
    if (permissionState !== 'default') return;
    const alreadyAsked = localStorage.getItem('lkd_notif_perm_asked') === 'true';
    if (alreadyAsked) return;

    // Delay 5 detik agar tidak mengganggu loading awal
    const timer = setTimeout(() => {
      requestPermission();
      localStorage.setItem('lkd_notif_perm_asked', 'true');
    }, 5000);
    return () => clearTimeout(timer);
  }, [permissionState, requestPermission]);

  // --- Hitung data notifikasi (untuk dikirim ke SW) ---
  const computeNotificationData = useCallback(() => {
    if (recentLkh === undefined || recentKalender === undefined) return null;

    const filledDates = new Set(recentLkh.map(l => l.tanggal));
    const holidayDates = new Set(
      recentKalender
        .filter(k => {
          const s = k.status?.toLowerCase() || '';
          return s.includes('libur') || s.includes('cuti');
        })
        .map(k => k.tanggal)
    );

    const today = new Date();
    const currentHour = today.getHours();
    const isSunday = today.getDay() === 0;
    const isHoliday = holidayDates.has(todayStr);
    const hasLkhToday = filledDates.has(todayStr);

    // Jangan munculkan notifikasi apapun jika hari ini adalah hari libur atau Minggu
    if (isSunday || isHoliday) return null;

    // 1. Reminder hari ini (setelah jam 12)
    const needsTodayReminder = currentHour >= 12 && !hasLkhToday;

    // 2. Hari terlewat
    const workingDays = getWorkingDaysBetween(new Date(thirtyDaysAgoStr), today);
    const missedDates = workingDays.filter(dateStr => {
      if (dateStr === todayStr) return false;
      if (holidayDates.has(dateStr)) return false;
      return !filledDates.has(dateStr);
    });

    return { needsTodayReminder, missedDates };
  }, [recentLkh, recentKalender, todayStr, thirtyDaysAgoStr]);

  // --- Kirim notifikasi ke SW saat tab hidden / app minimize ---
  useEffect(() => {
    if (permissionState !== 'granted') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;

      // Throttle: max 1 notifikasi per hari
      const lastNotifKey = 'lkd_last_system_notif';
      const lastNotifDate = localStorage.getItem(lastNotifKey);
      if (lastNotifDate === todayStr) return;

      const data = computeNotificationData();
      if (!data) return;

      const { needsTodayReminder, missedDates } = data;

      // Tentukan pesan yang akan dikirim
      let title = '';
      let body = '';
      let tag = '';

      if (needsTodayReminder && missedDates.length > 0) {
        title = 'Pengingat LKH 📋';
        body = `LKH hari ini belum diisi, dan ada ${missedDates.length} hari lainnya yang juga belum dilengkapi.`;
        tag = 'lkh-combined';
      } else if (needsTodayReminder) {
        title = 'Isi LKH Hari Ini 📝';
        body = 'Sudah lewat jam 12 siang! Jangan lupa isi Laporan Kinerja Harian hari ini.';
        tag = 'lkh-today';
      } else if (missedDates.length > 0) {
        const oldestFormatted = new Date(missedDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' });
        title = `${missedDates.length} Hari Belum Diisi ⚠️`;
        body = `Ada ${missedDates.length} hari kerja yang LKH-nya belum dilengkapi sejak ${oldestFormatted}.`;
        tag = 'lkh-missed';
      }

      if (!title) return;

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_LKH_NOTIFICATION',
          payload: { title, body, tag },
        });
        localStorage.setItem(lastNotifKey, todayStr);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [permissionState, todayStr, computeNotificationData]);

  // --- Register Periodic Background Sync ---
  useEffect(() => {
    if (permissionState !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      // @ts-expect-error - periodicSync is experimental
      if (registration.periodicSync) {
        try {
          // @ts-expect-error - periodicSync is experimental
          await registration.periodicSync.register('lkh-daily-reminder', {
            minInterval: 12 * 60 * 60 * 1000, // 12 jam
          });
        } catch {
          console.log('[LKH] Periodic sync not available');
        }
      }
    });
  }, [permissionState]);
}
