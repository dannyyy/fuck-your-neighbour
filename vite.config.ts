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
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Fuck Your Neighbour',
        short_name: 'FYN Jass',
        description: 'Schweizer Jass-Variante – allein gegen clevere KI-Gegner.',
        theme_color: '#0b3d27',
        background_color: '#06160f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
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
