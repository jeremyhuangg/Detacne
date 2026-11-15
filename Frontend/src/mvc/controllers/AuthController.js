import { api } from '../../api'
import { session } from '../../services/session'
import { User } from '../models/User'

export class AuthController {
  constructor() {
    this.userModel = User
  }

  async login(email, password) {
    const { token, user, raw } = await new User({ email, password }).login()
    session.save({ token, user: raw.user })
    return user
  }

  async register(name, email, password, gender, DOB) {
    const { token, user, raw } = await new User({ name, email, password, gender, DOB }).register()
    session.save({ token, user: raw.user })
    return user
  }

  async logout() {
    const req = api.logout()
    session.clear()
    await req
  }
}
