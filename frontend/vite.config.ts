import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Dev: Vite chạy ở 5173 và chuyển tiếp /api sang Spring Boot (8080) nên trình duyệt chỉ thấy một origin,
// giống production (cookie phiên, CSRF và OAuth callback hoạt động y hệt).
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: false } },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Tách thư viện lớn thành chunk riêng để trình duyệt cache lâu dài, độc lập với mã ứng dụng.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(@mui|@emotion)\//.test(id)) return 'mui'
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/(@tanstack|axios)\//.test(id)) return 'data'
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
