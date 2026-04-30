/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Precache semua aset dari build manifest
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// --- LKH Notification Handler ---

// Helper: showNotification wrapper (bypass strict TS for vibrate/actions)
function showLkhNotification(title: string, options: Record<string, unknown>) {
  return self.registration.showNotification(title, options as NotificationOptions);
}

// Handle pesan dari app untuk tampilkan notifikasi
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_LKH_NOTIFICATION') {
    const { title, body, tag } = event.data.payload;
    showLkhNotification(title, {
      body,
      tag, // Mencegah duplikasi notifikasi dengan tag yang sama
      icon: '/logo-man2.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Isi LKH' },
        { action: 'dismiss', title: 'Nanti' },
      ],
    });
  }

  // Handle skip waiting untuk update SW
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Buka atau fokus ke halaman input LKH
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Cari tab yang sudah terbuka
      for (const client of clientList) {
        if (client.url.includes('/lkh/input') || client.url.includes('/dashboard')) {
          client.focus();
          client.navigate('/lkh/input');
          return;
        }
      }
      // Jika tidak ada tab yang terbuka, buka baru
      if (self.clients.openWindow) {
        return self.clients.openWindow('/lkh/input');
      }
    })
  );
});

// Handle periodic background sync (Chrome 80+)
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'lkh-daily-reminder') {
    event.waitUntil(handlePeriodicReminder());
  }
});

async function handlePeriodicReminder() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Minggu

  // Hanya kirim notifikasi di jam kerja (12-20) dan bukan hari Minggu
  if (hour < 12 || hour > 20 || day === 0) return;

  // Cek apakah sudah kirim notifikasi hari ini
  // Gunakan Cache API sebagai "storage" sederhana di SW
  const cache = await caches.open('lkh-notif-meta');
  const todayKey = `notif-${now.toISOString().split('T')[0]}`;
  const existing = await cache.match(todayKey);
  if (existing) return; // Sudah kirim hari ini

  // Tampilkan notifikasi
  await showLkhNotification('Pengingat LKH 📋', {
    body: 'Jangan lupa isi Laporan Kinerja Harian hari ini!',
    tag: 'lkh-periodic-reminder',
    icon: '/logo-man2.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Isi LKH' },
      { action: 'dismiss', title: 'Nanti' },
    ],
  });

  // Tandai sudah kirim hari ini
  await cache.put(todayKey, new Response('sent'));
}
