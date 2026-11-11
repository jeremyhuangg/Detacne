export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000,
  mode: import.meta.env.MODE
}
