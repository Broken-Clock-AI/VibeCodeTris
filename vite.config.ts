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
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer: server => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      }
    }
  ]
});
