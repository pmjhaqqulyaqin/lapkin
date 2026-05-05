/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Precache semua aset dari build manifest
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// --- LKH Notification System ---

// Helper: showNotification wrapper (bypass strict TS for vibrate/actions/image)
function showLkhNotification(title: string, options: Record<string, unknown>) {
  return self.registration.showNotification(title, options as NotificationOptions);
}

// Handle pesan dari app untuk tampilkan notifikasi
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_LKH_NOTIFICATION') {
    const { title, body, tag } = event.data.payload;
    showLkhNotification(title, {
      body,
      tag,
      icon: '/logo-man2.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100, 50, 200],
      requireInteraction: true,
      silent: false,
      renotify: true,
      actions: [
        { action: 'open', title: '📝 Isi LKH' },
        { action: 'dismiss', title: 'Nanti' },
      ],
      data: { url: '/lkh/input' },
    });
  }

  // Handle skip waiting untuk update SW
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle klik pada notifikasi (body atau action button)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Tentukan URL target
  const targetUrl = (event.notification.data?.url as string) || '/lkh/input';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Cari tab LKD yang sudah terbuka
      for (const client of clientList) {
        if (client.url.includes('/dashboard') || client.url.includes('/lkh')) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Buka tab baru jika belum ada
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notificationclose (user swipe dismiss)
self.addEventListener('notificationclose', () => {
  // Bisa digunakan untuk analytics di masa depan
});

// --- Periodic Background Sync (Chrome 80+) ---
// Dijalankan oleh browser meskipun app tidak terbuka
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'lkh-daily-reminder') {
    event.waitUntil(handlePeriodicReminder());
  }
});

async function handlePeriodicReminder() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Minggu

  // Hanya kirim di jam 12-20, bukan hari Minggu
  if (hour < 12 || hour > 20 || day === 0) return;

  // Throttle: max 1 notifikasi per hari (gunakan Cache API)
  const cache = await caches.open('lkh-notif-meta');
  const todayKey = `notif-${now.toISOString().split('T')[0]}`;
  const existing = await cache.match(todayKey);
  if (existing) return;

  // Tampilkan notifikasi yang professional
  const hariIni = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long' });

  await showLkhNotification('Laporan Kinerja Digital', {
    body: `${hariIni} — Yuk isi LKH hari ini sebelum lupa! Ketuk untuk mulai mengisi.`,
    tag: 'lkh-periodic-reminder',
    icon: '/logo-man2.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100, 50, 200],
    requireInteraction: true,
    silent: false,
    renotify: true,
    actions: [
      { action: 'open', title: '📝 Isi LKH' },
      { action: 'dismiss', title: 'Nanti' },
    ],
    data: { url: '/lkh/input' },
  });

  // Tandai sudah kirim hari ini
  await cache.put(todayKey, new Response('sent'));

  // Bersihkan cache lama (> 7 hari)
  const keys = await cache.keys();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  for (const key of keys) {
    const dateStr = key.url.split('notif-')[1];
    if (dateStr && new Date(dateStr) < sevenDaysAgo) {
      await cache.delete(key);
    }
  }
}
