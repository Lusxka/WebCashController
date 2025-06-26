import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'WebCash - Gestão Financeira',
        short_name: 'WebCash',
        description: 'Aplicativo de gestão financeira pessoal e empresarial',
        theme_color: '#1E40AF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,  // Coloque aqui, no nível do build
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor_react'
            }
            if (id.includes('recharts')) {
              return 'vendor_recharts'
            }
            if (id.includes('jspdf')) {
              return 'vendor_jspdf'
            }
            return 'vendor_other'
          }
        }
      }
    }
  }
})
