import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Express backend so the browser only ever talks to
    // the Vite origin — no cross-origin/CORS in dev. The frontend uses relative
    // paths (e.g. '/api/vehicles') which are proxied to the backend's port.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
