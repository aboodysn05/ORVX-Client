import client from './client'

// Player profile + attribute assessment. Both calls resolve to the same
// { position, dominantFoot, heightCm, weightKg, attributes, overall, tier }
// shape returned by backend/src/services/players.service.js.
//
// getMyProfile() rejects with a 404 (err.response.status === 404) when the
// player hasn't completed the assessment yet — callers use that to decide
// whether to redirect to /assessment, same as the old
// hasCompletedAssessment() check did against localStorage.

export function submitAssessment(payload) {
  return client.post('/players/assessment', payload).then((res) => res.data.player)
}

export function getMyProfile() {
  return client.get('/players/me').then((res) => res.data.player)
}
