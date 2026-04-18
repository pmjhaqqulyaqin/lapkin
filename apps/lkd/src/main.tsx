import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Versi baru aplikasi tersedia. Muat ulang sekarang?')) {
      updateSW(true)
    }
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
