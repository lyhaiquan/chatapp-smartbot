import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window',
    'process.env': {},
    // Expose Phaser as a global so Phaser scene files can use it without importing
    Phaser: 'Phaser',
  },
  resolve: {
    alias: {
      events: 'events',
      stream: 'readable-stream',
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'events', 'readable-stream', 'process/browser', 'simple-peer', 'phaser', 'colyseus.js'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/colyseus': {
        target: 'ws://localhost:2567',
        ws: true,
        rewrite: (path) => path.replace(/^\/colyseus/, ''),
      },
    },
  },
})
