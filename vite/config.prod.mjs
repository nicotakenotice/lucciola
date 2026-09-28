import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    plugins: [
        react(),
        // Installable app with offline play. The service worker is registered by src/pwa.ts; a new
        // version waits for the next launch instead of replacing the game in the middle of a night.
        VitePWA({
            injectRegister: false,
            // The icons are already matched by globPatterns
            includeManifestIcons: false,
            manifest: {
                name: 'Lucciola',
                short_name: 'Lucciola',
                description: 'A firefly lights up a dark forest. Survive until dawn.',
                lang: 'en',
                categories: [ 'games' ],
                display: 'fullscreen',
                orientation: 'landscape',
                background_color: '#020308',
                theme_color: '#020308',
                icons: [
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                // Serve the first visit from the cache too, so it is ready for offline play without a reload
                clientsClaim: true,
                // Browsers with service workers all read woff2: the woff fallbacks are not cached
                globPatterns: [ '**/*.{js,css,html,woff2,png,svg}' ],
                // The Phaser chunk is about 1.3 MB
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
            }
        })
    ],
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: [ 'phaser' ]
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
