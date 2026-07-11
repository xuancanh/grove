import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Grove API is served by the Knowledge Loom enterprise backend
// (knowledge-loom-ee) under /api/grove. Point GROVE_API at it in dev.
const apiTarget = process.env.GROVE_API || 'http://localhost:8787';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': apiTarget,
    },
  },
});
