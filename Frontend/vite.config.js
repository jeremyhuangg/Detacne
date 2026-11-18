import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      port: 5173,
      // Saat development, /api/... diteruskan ke backend (tanpa awalan /api), jadi tidak kena masalah CORS.
      proxy: env.VITE_DEV_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_DEV_PROXY_TARGET,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, '')
            }
          }
        : undefined
    },
    build: { outDir: 'dist', sourcemap: mode !== 'production' }
  }
})
