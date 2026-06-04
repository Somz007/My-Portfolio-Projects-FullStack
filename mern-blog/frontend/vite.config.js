import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? '/My-Portfolio-Projects-FullStack/mern-blog/'
    : '/',
  plugins: [react()],
  server: {
    port: 5173,
    // The proxy is the key to development: any request that starts with
    // "/api" is forwarded to the Express server on port 5000. This means:
    //   - No CORS issues (the browser thinks both are on port 5173)
    //   - No hardcoded "http://localhost:5000" anywhere in the frontend code
    //   - The same API paths work in production when hosted behind a reverse proxy
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
