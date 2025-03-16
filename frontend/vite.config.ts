import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Add Node.js polyfills
    nodePolyfills({
      // Whether to polyfill specific nodejs globals and modules
      globals: {
        global: true,
        process: true,
        Buffer: true,
      },
      // Whether to polyfill nodejs: protocol imports
      protocolImports: true,
    }),
  ],
  base: '/',
  define: {
    // Explicitly define process.env
    'process.env': {},
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    // This is important for client-side routing to work properly
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  // This ensures proper handling of the client-side routing
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
