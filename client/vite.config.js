import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AnonChat',
        short_name: 'AnonChat',
        description: 'Anonymous, end-to-end encrypted real-time chat.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: '/ghost.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    // Minify với terser (mạnh hơn esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Xóa console.log
        drop_debugger: true, // Xóa debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Xóa các console functions
        passes: 2 // Chạy 2 lần để optimize tốt hơn
      },
      mangle: {
        safari10: true // Tương thích Safari
      },
      format: {
        comments: false // Xóa tất cả comments
      }
    },
    // Tách chunks để optimize loading
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket-vendor': ['socket.io-client'],
          'ui-vendor': ['framer-motion', 'qrcode.react']
        }
      }
    },
    // Tăng chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source map (tắt trong production)
    sourcemap: false
  }
});
