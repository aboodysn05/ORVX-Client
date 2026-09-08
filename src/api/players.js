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

// Public — resolves to null (not a rejection) when no player has completed
// the assessment yet. Used by the logged-out Hero page's illustrative card.
export function getFeaturedPlayer() {
  return client.get('/players/featured').then((res) => res.data.player)
}

// The player's own club applications (pending / accepted / declined / withdrawn).
export function getMyClubApplications() {
  return client.get('/players/me/applications').then((res) => res.data.applications)
}

// Withdraw one still-pending application, freeing the one-pending-at-a-time slot.
export function withdrawMyClubApplication(appId) {
  return client.delete(`/players/me/applications/${appId}`).then((res) => res.data.application)
}

// A club head coach (or admin) changes a rostered player's registered position.
// Switching to/from Goalkeeper swaps the attribute set (reset to a baseline).
export function setPlayerRegisteredPosition(playerId, position) {
  return client
    .patch(`/players/${playerId}/registered-position`, { position })
    .then((res) => res.data.player)
}
