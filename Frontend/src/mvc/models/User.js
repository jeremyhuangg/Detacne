import { api } from '../../api'
import { session } from '../../services/session'

export class User {
  constructor({ userId = 0, name = '', email = '', password = '', gender = false, DOB = null, role = 'user', createdAt = null } = {}) {
    this.userId = userId
    this.name = name
    this.email = email
    this.password = password
    this.gender = gender // Boolean: true = Laki-laki, false = Perempuan
    this.DOB = DOB
    this.role = role
    this.createdAt = createdAt
  }

  static fromApi(u = {}) {
    return new User({
      userId: u.id ?? u.userId ?? 0,
      name: u.name || '',
      email: u.email || '',
      gender: u.gender === true || u.gender === 'Laki-laki',
      DOB: u.birthdate || u.DOB || null,
      role: u.role || 'user',
      createdAt: u.created_at || u.createdAt || null
    })
  }

  toApi() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      gender: this.gender ? 'Laki-laki' : 'Perempuan',
      birthdate: this.DOB
    }
  }

  async register() {
    const res = await api.register(this.toApi())
    return { token: res.token, user: User.fromApi(res.user), raw: res }
  }

  async login() {
    const res = await api.login({ email: this.email, password: this.password })
    return { token: res.token, user: User.fromApi(res.user), raw: res }
  }

  hasRole(role) {
    return this.role === role
  }

  static current() {
    const u = session.getUser()
    return u ? User.fromApi(u) : null
  }
}
