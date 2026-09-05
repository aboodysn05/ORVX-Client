// Player profile reads/writes now go through src/api/players.js (real
// backend calls). The one thing still local: the "approved baseline
// sessions" count, which stays a front-end dev toggle because there's no
// coach-approval workflow in the backend yet (review_status never leaves
// 'pending') — see usePlayerDashboard.js's "Preview state" control.

const APPROVED_KEY = 'orvx_approved_sessions'

function keyFor(email) {
  return email || 'guest'
}

export function readApprovedSessions(email) {
  try {
    const store = JSON.parse(localStorage.getItem(APPROVED_KEY) || '{}')
    const value = Number(store[keyFor(email)])
    return Number.isFinite(value) ? Math.max(0, Math.min(3, value)) : 0
  } catch {
    return 0
  }
}

export function writeApprovedSessions(email, count) {
  try {
    const store = JSON.parse(localStorage.getItem(APPROVED_KEY) || '{}')
    store[keyFor(email)] = Math.max(0, Math.min(3, Number(count) || 0))
    localStorage.setItem(APPROVED_KEY, JSON.stringify(store))
  } catch {
    // storage unavailable — preview toggle just won't persist across reloads
  }
}
