// Browser-only stand-in for the /auth API until the Express backend implements
// it. Accounts are stored in localStorage; "tokens" are opaque throwaway
// strings. Same resolved shape as the real endpoints ({ token, user }) and the
// same rejection shape RegisterForm/LoginForm expect
// (err.response.data.message), so swapping back to the network path in
// ./auth.js needs no changes here or in the components.

const USERS_KEY = 'orvx_mock_users'
const USER_KEY = 'orvx_user'

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    // storage unavailable — accounts just won't persist across reloads
  }
}

function fieldError(message) {
  const error = new Error(message)
  error.response = { data: { message } }
  return error
}

function makeToken() {
  return `mock.${Math.random().toString(36).slice(2)}.${Date.now()}`
}

function withoutPassword(record) {
  const { password, ...user } = record
  return user
}

export function register(payload) {
  const email = (payload.email || '').trim().toLowerCase()
  const users = readUsers()

  if (!payload.name || !email || !payload.password) {
    return Promise.reject(fieldError('Name, email and password are all required.'))
  }
  if (users[email]) {
    return Promise.reject(fieldError('An account with that email already exists.'))
  }

  const user = {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    name: payload.name.trim(),
    email: payload.email.trim(),
    role: payload.role || 'player',
  }
  if (payload.organization) {
    user.organization = payload.organization
  }

  users[email] = { ...user, password: payload.password }
  writeUsers(users)

  return Promise.resolve({ token: makeToken(), user })
}

export function login(email, password) {
  const key = (email || '').trim().toLowerCase()
  const record = readUsers()[key]

  if (!record || record.password !== password) {
    return Promise.reject(fieldError('Email or password is incorrect.'))
  }

  return Promise.resolve({ token: makeToken(), user: withoutPassword(record) })
}

export function getCurrentUser() {
  // AuthProvider already hydrates the signed-in user from localStorage; there
  // is nothing to re-fetch in mock mode.
  try {
    return Promise.resolve(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  } catch {
    return Promise.resolve(null)
  }
}
