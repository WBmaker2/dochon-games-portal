import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'manifest.json'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.firebasedatabase\.app\/.*$/,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*$/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-webfonts', expiration: { maxEntries: 30, maxAgeSeconds: 31536000 } }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  base: '/dochon-games-portal/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
          confetti: ['canvas-confetti']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
