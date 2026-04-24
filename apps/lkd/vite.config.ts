import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-man2.svg', 'favicon.svg', 'fonts/*.ttf', 'logo login.png'],
      manifest: {
        name: 'Laporan Kinerja Digital',
        short_name: 'LKD',
        description: 'Aplikasi Laporan Kinerja Digital untuk Tenaga Pendidik — MAN 2 Lombok Timur',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo-man2.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'logo-man2.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'logo-man2.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})

