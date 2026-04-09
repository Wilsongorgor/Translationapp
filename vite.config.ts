import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electronPlugin from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electronPlugin([
      {
        entry: 'src/main/main.ts',
      },
      {
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  build: {
    outDir: 'dist',
    // 优化启动速度
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    // 只构建React，不构建Electron（使用tsc单独编译）
    emptyOutDir: true,
    lib: undefined,
  },
  // 优化预加载提示
  server: {
    preTransformRequests: true,
  },
})
