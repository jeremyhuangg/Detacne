import { api } from '../../api'
import { session } from '../../services/session'
import { User } from '../models/User'

export class AuthController {
  constructor() {
    this.userModel = User
  }

  async login(email, password) {
    const { token, refreshToken, user } = await new User({ email, password }).login()
    session.save({ token, refreshToken, user: user.toSession() })
    return user
  }

  async register(name, email, password, gender, DOB) {
    return new User({ name, email, password, gender, DOB }).register()
  }

  async sendOtp(email) {
    try {
      await api.sendOtp({ email })
    } catch (err) {
      if (err.status !== 409) throw err
      await api.resendOtp({ email })
    }
  }

  async verifyOtp(email, otp) {
    await api.verifyOtp({ email, otp })
  }

  async logout() {
    const refreshToken = session.getRefreshToken()
    session.clear()
    await api.logout(refreshToken)
  }
}
