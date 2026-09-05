// Front-end store for a coach's club-management request. There's no backend
// for coach onboarding yet, so the submitted request is kept in localStorage
// keyed by the coach's email. The Hero nav reads this to show a "pending"
// state, and the gateway page reads it to lock itself to the pending view
// once a request exists. Replace with a real API call when coach approval
// lands (admin flips status from 'pending' to 'approved').

const STORE_KEY = 'orvx_coach_application'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

const keyFor = (email) => email || 'guest'

export function readCoachApplication(email) {
  return readStore()[keyFor(email)] || null
}

export function saveCoachApplication(email, request) {
  try {
    const store = readStore()
    store[keyFor(email)] = { ...request, status: 'pending', submittedAt: new Date().toISOString() }
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // storage unavailable — the request just won't persist across reloads
  }
}

export function clearCoachApplication(email) {
  try {
    const store = readStore()
    delete store[keyFor(email)]
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}
