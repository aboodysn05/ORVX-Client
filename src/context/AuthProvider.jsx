import { useState } from 'react'
import * as authApi from '../api/auth'
import { AuthContext, TOKEN_KEY, USER_KEY } from './AuthContext'

// Holds the authenticated user and exposes login / register / logout.
// The session (token + user) is mirrored into localStorage so a page
// refresh keeps the user signed in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })

  function saveSession({ token, user: sessionUser }) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
  }

  async function login(email, password) {
    const data = await authApi.login(email, password)
    saveSession(data)
    return data.user
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    saveSession(data)
    return data.user
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = { user, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
