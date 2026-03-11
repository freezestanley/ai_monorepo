import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: [
      ...(command === 'build'
        ? [{ find: '@/mock/setup', replacement: path.resolve(__dirname, './src/mock/noop.ts') }]
        : []),
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
      },
    },
  },
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: './dist',
  },
}))
