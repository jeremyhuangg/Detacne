import { request } from './http'

const json = (method, path, auth = true) => (body) => request(path, { method, body, auth })
const open = (method, path) => json(method, path, false)

export const api = {
  login: open('POST', '/authentications'),
  register: open('POST', '/users'),
  sendOtp: open('POST', '/users/registration-otp'),
  verifyOtp: open('POST', '/users/registration-otp/verify'),
  resendOtp: open('POST', '/users/registration-otp/resend'),
  forgot: open('POST', '/forgot-password'),
  resetPassword: open('POST', '/reset-password'),
  changePassword: json('PUT', '/users/change-password'),
  logout: (refreshToken) =>
    refreshToken
      ? request('/authentications', { method: 'DELETE', body: { refreshToken }, auth: false }).catch(() => ({}))
      : Promise.resolve({}),
  me: (id) => request(`/users/${encodeURIComponent(id)}`).then((r) => r.user),
  detect: (file) => {
    const form = new FormData()
    form.append('photo', file)
    return request('/detections', { method: 'POST', form })
  },

  saveEntry: (detectionId, note) =>
    request('/progress/entries', { method: 'POST', body: { detection_id: detectionId, note } }),

  progress: {
    list: () => request('/progress/entries'),
    update: (id, body) => request(`/progress/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
    remove: (id) => request(`/progress/entries/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  routines: {
    list: () => request('/routines'),
    create: json('POST', '/routines'),
    update: (id, body) => request(`/routines/${encodeURIComponent(id)}`, { method: 'PUT', body }),
    remove: (id) => request(`/routines/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    tasks: (from, to) => request('/routines/tasks', { query: { from, to } }),
    setTask: (body) => request('/routines/tasks', { method: 'PUT', body }),
    reminders: () => request('/routines/reminders'),
    saveReminders: json('PUT', '/routines/reminders')
  },

  articles: {
    list: (query) => request('/articles', { query }).then((r) => r.items || r),
    get: (id) => request(`/articles/${encodeURIComponent(id)}`),
    create: json('POST', '/admin/articles'),
    update: (id, body) => request(`/admin/articles/${encodeURIComponent(id)}`, { method: 'PUT', body }),
    remove: (id) => request(`/admin/articles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    bulk: json('POST', '/admin/articles/bulk'),
    activity: () => request('/admin/activity')
  }
}
