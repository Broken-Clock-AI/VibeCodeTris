// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/VibeCodeTris/',
  server: {
    port: 3000,
    open: true, // Automatically open in the browser
  },
  build: {
    sourcemap: true,
  },
  worker: {
    format: 'es',
  },
});
