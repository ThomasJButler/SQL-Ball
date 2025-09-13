import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    exclude: ['chromadb', 'chromadb-default-embed']
  },
  build: {
    rollupOptions: {
      external: ['@chroma-core/default-embed'],
      output: {
        globals: {
          '@chroma-core/default-embed': 'ChromaDefaultEmbed'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/football-data': {
        target: 'https://api.football-data.org/v4',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/football-data/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the API key from the original request headers
            const apiKey = req.headers['x-auth-token'];
            if (apiKey) {
              proxyReq.setHeader('X-Auth-Token', apiKey);
            }
            // Log for debugging
            console.log('Proxying:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        }
      }
    }
  }
})