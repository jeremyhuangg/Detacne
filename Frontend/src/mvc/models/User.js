import { api } from '../../api'
import { session, tokenPayload } from '../../services/session'

// Backend mengirim DATE sebagai ISO timestamp; ambil tanggal lokalnya (YYYY-MM-DD).
const dateOnly = (v) => {
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export class User {
  constructor({ userId = 0, name = '', email = '', password = '', gender = false, DOB = null, role = 'user', createdAt = null } = {}) {
    this.userId = userId
    this.name = name
    this.email = email
    this.password = password
    this.gender = gender // true = laki-laki
    this.DOB = DOB
    this.role = role
    this.createdAt = createdAt
  }

  // Menerima bentuk dari backend (nickname, date_of_birth) maupun bentuk yang disimpan di session.
  static fromApi(u = {}) {
    return new User({
      userId: u.id ?? u.userId ?? 0,
      name: u.nickname || u.name || '',
      email: u.email || '',
      gender: u.gender === true || u.gender === 'male',
      DOB: dateOnly(u.date_of_birth || u.birthdate || u.DOB),
      role: u.role || 'user',
      createdAt: u.created_at || u.createdAt || null
    })
  }

  // Payload untuk POST /users
  toApi() {
    return {
      nickname: this.name,
      email: this.email,
      password: this.password,
      gender: this.gender ? 'male' : 'female',
      dateOfBirth: this.DOB
    }
  }

  // Bentuk yang disimpan di localStorage dan dipakai UI (state.user)
  toSession() {
    return {
      id: this.userId,
      name: this.name,
      email: this.email,
      gender: this.gender ? 'male' : 'female',
      birthdate: this.DOB,
      role: this.role
    }
  }

  async register() {
    const res = await api.register(this.toApi())
    return { id: res.id, email: this.email }
  }

  async login() {
    const { accessToken, refreshToken } = await api.login({ email: this.email, password: this.password })
    const id = tokenPayload(accessToken)?.id
    const profile = id ? await api.me(id) : null
    return { token: accessToken, refreshToken, user: User.fromApi(profile || { id, email: this.email }) }
  }

  hasRole(role) {
    return this.role === role
  }

  static current() {
    const u = session.getUser()
    return u ? User.fromApi(u) : null
  }
}
