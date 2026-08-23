import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ['react','react-dom','react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui:       ['react-hot-toast','framer-motion'],
          charts:   ['recharts'],
          icons:    ['lucide-react'],
        }
      }
    }
  },
  server: {
    port: 5173,
  }
})
