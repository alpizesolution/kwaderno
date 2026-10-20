import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [],
      manifest: {
        name: 'Kwaderno - Ang Iyong Talaarawan',
        short_name: 'Kwaderno',
        description: 'Ligtas, pribado, at offline na talaarawan para sa kwento ng bawat araw mo.',
        lang: 'fil',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAF7F2',
        theme_color: '#FAF7F2',
        icons: [
          { src: '/icons/kwaderno-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/kwaderno-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        // Never add diary records, backups, or decrypted content to precache/runtime caches.
      },
    }),
  ],
});
