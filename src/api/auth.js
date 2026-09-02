import client from './client'

// Auth endpoints. Each call returns the parsed response body.
// login/register resolve to { token, user }.

export function login(email, password) {
  return client.post('/auth/login', { email, password }).then((res) => res.data)
}

export function register(payload) {
  return client.post('/auth/register', payload).then((res) => res.data)
}

export function getCurrentUser() {
  return client.get('/auth/me').then((res) => res.data.user)
}
