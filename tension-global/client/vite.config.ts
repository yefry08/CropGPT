import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// VITE_STATIC=1 → build para GitHub Pages (rutas relativas, sin modo online).
export default defineConfig({
  base: process.env.VITE_STATIC ? './' : '/',
  plugins: [react()],
  build: { outDir: '../dist/public', emptyOutDir: true, chunkSizeWarningLimit: 900 },
  server: {
    port: 5173,
    proxy: { '/socket.io': { target: 'http://localhost:3001', ws: true } },
  },
});
