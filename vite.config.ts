import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 使用固定端口 32337
const PORT = 32337;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/leetcode-3-longest-substring-without-repeating-characters/',
  server: {
    port: PORT,
  },
})
