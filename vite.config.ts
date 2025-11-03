// vite.config.ts
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  base: '/VibeCodeTris/',
  server: {
    port: 3000,
    open: true, // Automatically open in the browser
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      plugins: [
        {
          name: 'copy-headers',
          writeBundle() {
            const headersContent = readFileSync(resolve(__dirname, './_headers'), 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: '_headers',
              source: headersContent,
            });
          },
        },
      ],
    },
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
