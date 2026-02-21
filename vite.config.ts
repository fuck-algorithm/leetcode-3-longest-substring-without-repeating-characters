import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 使用固定端口 5173
const PORT = 5173;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/leetcode-3-longest-substring-without-repeating-characters/',
  server: {
    port: PORT,
  },
})
