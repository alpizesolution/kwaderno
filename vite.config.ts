import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/kwaderno.svg'],
      manifest: {
        name: 'Kwaderno - Ang Iyong Talaarawan',
        short_name: 'Kwaderno',
        description: 'Ligtas, pribado, at offline na talaarawan para sa kwento ng bawat araw mo.',
        lang: 'fil',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAF7F2',
        theme_color: '#FAF7F2',
        icons: [{ src: '/icons/kwaderno.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        // Never add diary records, backups, or decrypted content to precache/runtime caches.
      },
    }),
  ],
});
