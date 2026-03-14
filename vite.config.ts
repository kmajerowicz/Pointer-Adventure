import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: false, // using public/manifest.json
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB — Mapbox GL JS is ~2 MiB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'psi-szlak-mapbox-tiles',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'psi-szlak-supabase-trails',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 3, // fall back to cache after 3s
            },
          },
        ],
      },
    }),
  ],
})
