import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    include: ['chromadb']
  },
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      // Polyfill for ChromaDB default embeddings
      '@chroma-core/default-embed': new URL('./src/lib/rag/chromaPolyfill.ts', import.meta.url).pathname
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chromadb': ['chromadb']
        }
      }
    }
  },
})