import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

// --- Types ---
export interface LkhNotification {
  type: 'today' | 'missed';
  message: string;
  missedDates?: string[];
  missedCount?: number;
  oldestMissed?: string;
}

export interface UseLkhNotificationReturn {
  notifications: LkhNotification[];
  dismissToday: () => void;
  dismissMissed: () => void;
  requestNotificationPermission: () => Promise<void>;
  notificationPermission: NotificationPermission | 'unsupported';
}

// --- Helpers ---
const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWorkingDaysBetween = (startDate: Date, endDate: Date): string[] => {
  const days: string[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    // Skip Minggu (0)
    if (current.getDay() !== 0) {
      days.push(toDateStr(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

// --- Hook ---
export function useLkhNotification(): UseLkhNotificationReturn {
  const [dismissedToday, setDismissedToday] = useState(false);
  const [dismissedMissed, setDismissedMissed] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Refresh jam setiap 60 detik (untuk deteksi perpindahan jam 12)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

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

  // Hitung notifikasi
  const notifications: LkhNotification[] = [];

  if (recentLkh !== undefined && recentKalender !== undefined) {
    // Set tanggal-tanggal yang sudah ada LKH
    const filledDates = new Set(recentLkh.map(l => l.tanggal));

    // Set tanggal-tanggal libur
    const holidayDates = new Set(
      recentKalender
        .filter(k => {
          const s = k.status?.toLowerCase() || '';
          return s.includes('libur') || s.includes('cuti');
        })
        .map(k => k.tanggal)
    );

    // --- 1. Reminder Hari Ini (hanya setelah jam 12) ---
    if (currentHour >= 12 && !dismissedToday) {
      const today = new Date();
      const isSunday = today.getDay() === 0;
      const isHoliday = holidayDates.has(todayStr);
      const hasLkhToday = filledDates.has(todayStr);

      if (!isSunday && !isHoliday && !hasLkhToday) {
        notifications.push({
          type: 'today',
          message: 'Sudah lewat jam 12 siang! Yuk isi LKH hari ini sebelum lupa 📝',
        });
      }
    }

    // --- 2. Peringatan Hari Terlewat ---
    if (!dismissedMissed) {
      const workingDays = getWorkingDaysBetween(thirtyDaysAgo, new Date());
      const missedDates = workingDays.filter(dateStr => {
        // Skip hari ini (ditangani oleh reminder #1)
        if (dateStr === todayStr) return false;
        // Skip hari libur
        if (holidayDates.has(dateStr)) return false;
        // Cek apakah belum diisi
        return !filledDates.has(dateStr);
      });

      if (missedDates.length > 0) {
        const oldestDate = missedDates[0];
        const formatted = new Date(oldestDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
        });

        notifications.push({
          type: 'missed',
          message: `Ada ${missedDates.length} hari kerja yang belum diisi LKH-nya sejak ${formatted}`,
          missedDates,
          missedCount: missedDates.length,
          oldestMissed: oldestDate,
        });
      }
    }
  }

  // --- System Notification (saat app terbuka di background tab) ---
  useEffect(() => {
    if (permissionState !== 'granted') return;
    if (notifications.length === 0) return;

    // Kirim system notification hanya saat tab tidak visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && notifications.length > 0) {
        // Cek apakah sudah pernah kirim notif hari ini
        const lastNotifKey = 'lkd_last_system_notif';
        const lastNotifDate = localStorage.getItem(lastNotifKey);
        if (lastNotifDate === todayStr) return; // Sudah dikirim hari ini

        const todayNotif = notifications.find(n => n.type === 'today');
        const missedNotif = notifications.find(n => n.type === 'missed');

        const body = todayNotif
          ? todayNotif.message
          : missedNotif
            ? missedNotif.message
            : '';

        if (body && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_LKH_NOTIFICATION',
            payload: {
              title: 'Pengingat LKH 📋',
              body,
              tag: 'lkh-reminder',
            },
          });
          localStorage.setItem(lastNotifKey, todayStr);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [notifications, permissionState, todayStr]);

  // --- Schedule periodic notification via SW ---
  useEffect(() => {
    if (permissionState !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;

    // Register periodic sync jika tersedia (Chrome 80+)
    navigator.serviceWorker.ready.then(async (registration) => {
      // @ts-expect-error - periodicSync is experimental
      if (registration.periodicSync) {
        try {
          // @ts-expect-error - periodicSync is experimental
          await registration.periodicSync.register('lkh-daily-reminder', {
            minInterval: 12 * 60 * 60 * 1000, // 12 jam
          });
        } catch {
          // Periodic sync not allowed or not supported, fall through
          console.log('[LKH] Periodic sync not available, using fallback');
        }
      }
    });
  }, [permissionState]);

  const requestNotificationPermission = useCallback(async () => {
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

  return {
    notifications,
    dismissToday: () => setDismissedToday(true),
    dismissMissed: () => setDismissedMissed(true),
    requestNotificationPermission,
    notificationPermission: permissionState,
  };
}
