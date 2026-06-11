/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  // Build → Projekt-Pfad der GitHub Page (https://dannyyy.github.io/fuck-your-neighbour/),
  // Dev-Server bleibt unter "/".
  base: command === 'build' ? '/fuck-your-neighbour/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      // Im Dev-Server aktiv, damit sich die Offline-/Installierbarkeit auch mit
      // `npm run dev` testen lässt (sonst nur nach `npm run build && npm run preview`).
      devOptions: { enabled: true },
      workbox: {
        // Alle gebauten Assets (JS/CSS/SVG/HTML) werden vorab gecacht.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Google-Fonts liegen auf einem fremden CDN und werden daher zur Laufzeit
        // gecacht, damit Schriften auch offline verfügbar bleiben.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Fuck Your Neighbour',
        short_name: 'FYN Jass',
        lang: 'de',
        description: 'Schweizer Jass-Variante – allein gegen clevere KI-Gegner.',
        theme_color: '#0b3d27',
        background_color: '#06160f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
}))
