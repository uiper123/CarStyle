import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['html2pdf.js']
  },
  resolve: {
    alias: {
      'html2pdf.js': 'html2pdf.js/dist/html2pdf.bundle.min.js'
    }
  },
  server: {
    port: 3000
  }
})
