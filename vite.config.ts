import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function wasmMimePlugin(): Plugin {
  return {
    name: 'wasm-mime-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.includes('swisseph.wasm')) {
          const wasmPath = path.resolve(__dirname, 'public/swisseph.wasm');
          if (fs.existsSync(wasmPath)) {
            res.setHeader('Content-Type', 'application/wasm');
            fs.createReadStream(wasmPath).pipe(res);
            return;
          }
        }
        if (url.includes('swisseph.data')) {
          const dataPath = path.resolve(__dirname, 'public/swisseph.data');
          if (fs.existsSync(dataPath)) {
            res.setHeader('Content-Type', 'application/octet-stream');
            fs.createReadStream(dataPath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

function apiPlugin(): Plugin {
  return {
    name: 'dssme-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          try {
            const { handleApiRequest } = await import('./src/server/apiMiddleware.js');
            const handled = await handleApiRequest(req, res);
            if (handled) return;
          } catch (err) {
            console.error('API middleware error:', err);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), wasmMimePlugin(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
