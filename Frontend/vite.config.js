import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      port: 5173,
      proxy: env.VITE_DEV_PROXY_TARGET
        ? { '/api': { target: env.VITE_DEV_PROXY_TARGET, changeOrigin: true } }
        : undefined
    },
    build: { outDir: 'dist', sourcemap: mode !== 'production' }
  }
})
