import client from './client'
import * as mockAuth from './authMock'

// Auth endpoints. Each call returns the parsed response body.
// login/register resolve to { token, user }.
//
// The Express API does not implement /auth yet, so while
// VITE_USE_MOCK_AUTH is not "false" these calls are served entirely in the
// browser by ./authMock. Set VITE_USE_MOCK_AUTH=false (and start the backend)
// to switch every call below back to the real network path — no other file
// changes.
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false'

export function login(email, password) {
  if (USE_MOCK_AUTH) return mockAuth.login(email, password)
  return client.post('/auth/login', { email, password }).then((res) => res.data)
}

export function register(payload) {
  if (USE_MOCK_AUTH) return mockAuth.register(payload)
  return client.post('/auth/register', payload).then((res) => res.data)
}

export function getCurrentUser() {
  if (USE_MOCK_AUTH) return mockAuth.getCurrentUser()
  return client.get('/auth/me').then((res) => res.data.user)
}
