import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Simpan referensi updateSW ke window agar bisa dipanggil dari UI
    (window as any).__lkdUpdateSW = () => updateSW(true);

    // Buat banner update yang lebih profesional (bukan confirm() browser)
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.innerHTML = `
      <div style="position:fixed;bottom:96px;left:50%;transform:translateX(-50%);z-index:9999;
        background:#0f766e;color:white;padding:12px 20px;border-radius:16px;
        box-shadow:0 8px 30px rgba(0,0,0,0.2);display:flex;align-items:center;gap:12px;
        font-family:'Inter',system-ui,sans-serif;max-width:90vw;animation:lkd-spin 0.3s ease-out;">
        <span style="font-size:13px;font-weight:600;">Versi baru tersedia!</span>
        <button onclick="(window).__lkdUpdateSW()" style="background:white;color:#0f766e;border:none;
          padding:6px 16px;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;">
          Perbarui
        </button>
        <button onclick="this.closest('#sw-update-banner').remove()" style="background:transparent;
          border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:18px;padding:0 4px;">✕</button>
      </div>
    `;
    document.body.appendChild(banner);
  },
  onOfflineReady() {
    console.log('Aplikasi siap digunakan secara offline!')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
