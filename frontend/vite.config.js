import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',  // Listen on all interfaces for WiFi access
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
