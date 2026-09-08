import client from './client'

// Coach onboarding. Shapes match backend/src/services/coaches.service.js.

export function applyAsCoach(payload) {
  return client.post('/coaches/applications', payload).then((res) => res.data.application)
}

export function getMyCoachApplication() {
  return client.get('/coaches/applications/me').then((res) => res.data.application)
}

