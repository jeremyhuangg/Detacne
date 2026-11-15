const TOKEN_KEY = 'detacneToken'
const USER_KEY = 'detacneUser'

export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  },
  save: ({ token, user }) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}
