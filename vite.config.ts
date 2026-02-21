import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 生成30000-65535之间的随机端口
const getRandomPort = () => Math.floor(Math.random() * (65535 - 30000 + 1)) + 30000;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/leetcode-3-longest-substring-without-repeating-characters/',
  server: {
    port: getRandomPort(),
  },
})
