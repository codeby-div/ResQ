import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'pwa-icon-192.svg'],
      manifest: {
        name: 'ResQ',
        short_name: 'ResQ',
        description: 'Emergency Resource Allocator',
        start_url: '/',
        display: 'standalone',
        background_color: '#0F1117',
        theme_color: '#C0392B',
        orientation: 'portrait-primary',
        icons: [
          { src: '/pwa-icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
  },
})
