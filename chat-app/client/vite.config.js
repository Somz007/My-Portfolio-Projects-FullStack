import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? '/My-Portfolio-Projects-FullStack/chat-app/'
    : '/',
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': { target: 'http://localhost:5003', changeOrigin: true },
      // Socket.io uses /socket.io path for its handshake — proxy that too.
      '/socket.io': { target: 'http://localhost:5003', changeOrigin: true, ws: true },
    },
  },
});
