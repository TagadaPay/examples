import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok.app',
      '.ngrok.io',
      'c77926c6a0fe.ngrok.app'
    ],
  },
});
