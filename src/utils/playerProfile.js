// Front-end stand-in for the player-profile store.
//
// The player assessment has no backend yet, so the completed card is kept in
// localStorage keyed by the player's email. When the Node/PostgreSQL API lands,
// replace these three helpers with calls in `src/api/players.js`
// (e.g. POST /players/assessment, GET /players/me) — the rest of the UI does
// not touch localStorage directly.

const STORE_KEY = 'orvx_player_profile'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

function keyFor(email) {
  return email || 'guest'
}

export function savePlayerProfile(email, profile) {
  try {
    const store = readStore()
    store[keyFor(email)] = { ...profile, assessedAt: new Date().toISOString() }
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // storage unavailable (private mode, quota) — the assessment simply
    // won't persist until the backend exists; not worth surfacing here.
  }
}

export function readPlayerProfile(email) {
  return readStore()[keyFor(email)] || null
}

export function hasCompletedAssessment(email) {
  return Boolean(readPlayerProfile(email))
}
