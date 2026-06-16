import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electronPlugin from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electronPlugin([
      {
        entry: 'src/main/preload.ts',
        onstart(options) { options.reload() },
      },
    ]),
    renderer(),
  ],
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: { manualChunks: { 'react-vendor': ['react', 'react-dom'] } },
    },
    emptyOutDir: true,
  },
})

