import { env } from '../config/env'
import { session } from '../services/session'

export class ApiError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.code = code
    this.status = status
  }
}

export async function request(path, { method = 'GET', body, form, query, signal } = {}) {
  const headers = { Accept: 'application/json' }
  const token = session.getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload = form
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const qs = query ? `?${new URLSearchParams(query)}` : ''
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), env.timeoutMs)
  signal?.addEventListener('abort', () => ctrl.abort())

  let res
  try {
    res = await fetch(`${env.apiBaseUrl}${path}${qs}`, { method, headers, body: payload, signal: ctrl.signal })
  } catch {
    throw new ApiError('NETWORK', 'Server tidak merespons.')
  } finally {
    clearTimeout(timer)
  }

  const data = res.status === 204 ? {} : await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401 && token) {
      session.clear()
      window.dispatchEvent(new Event('auth:expired'))
    }
    throw new ApiError(
      data.error?.code || 'SERVER',
      data.error?.message || 'Terjadi kesalahan pada server.',
      res.status
    )
  }
  return data
}
