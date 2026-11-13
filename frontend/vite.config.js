import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    fs: {
      allow: [
        fileURLToPath(new URL('./', import.meta.url)),
        fileURLToPath(new URL('../packages/shared/', import.meta.url)),
        fileURLToPath(new URL('../node_modules/', import.meta.url)),
      ],
    },
    proxy: {
      '/api/': 'http://127.0.0.1:3001',
    },
  },
})
