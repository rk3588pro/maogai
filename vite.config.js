import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      uni(),
    ],
    // 把 .env 中的 VITE_API_BASE 注入为全局常量，供 uni-app 运行时代码直接读取
    define: {
      VITE_API_BASE: JSON.stringify(env.VITE_API_BASE || '')
    }
  }
})
