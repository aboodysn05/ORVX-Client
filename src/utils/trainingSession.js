// Front-end store for the training-session lifecycle, keyed by player email.
//
// One session is "in flight" at a time and moves through:
//   built  ->  active (workout running)  ->  completed (all sets ticked)
// On proof submission the completed session is archived into the finished list
// the dashboard reads, and the in-flight slot is cleared so the player starts
// fresh next time.
//
// Replace with POST /sessions + POST /submissions + GET /sessions?player=me
// once the backend exists — no screen touches localStorage directly.

const ACTIVE_KEY = 'orvx_active_session'
const FINISHED_KEY = 'orvx_finished_sessions'

function readMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

function writeMap(key, map) {
  try {
    localStorage.setItem(key, JSON.stringify(map))
  } catch {
    // storage unavailable (private mode, quota) — lifecycle just won't persist
  }
}

const keyFor = (email) => email || 'guest'

// --- in-flight session ---------------------------------------------------------

export function readActiveSession(email) {
  return readMap(ACTIVE_KEY)[keyFor(email)] || null
}

// Called by the Session Builder's "Start & Record". Overwrites any previous
// in-flight session — callers guard against that when one is unfinished.
export function startSession(email, session) {
  const map = readMap(ACTIVE_KEY)
  map[keyFor(email)] = {
    ...session,
    status: 'active',
    startedAt: new Date().toISOString(),
    completedAt: null,
    progress: null,
  }
  writeMap(ACTIVE_KEY, map)
  return map[keyFor(email)]
}

// Persist the per-set checklist so a reload during a workout keeps progress.
export function saveSessionProgress(email, progress) {
  const map = readMap(ACTIVE_KEY)
  const current = map[keyFor(email)]
  if (!current || current.status !== 'active') return
  map[keyFor(email)] = { ...current, progress }
  writeMap(ACTIVE_KEY, map)
}

// Locks the workout: once completed it can no longer be re-entered or edited,
// only submitted for proof (or discarded).
export function completeSession(email) {
  const map = readMap(ACTIVE_KEY)
  const current = map[keyFor(email)]
  if (!current || current.status === 'completed') return current || null
  map[keyFor(email)] = {
    ...current,
    status: 'completed',
    completedAt: new Date().toISOString(),
  }
  writeMap(ACTIVE_KEY, map)
  return map[keyFor(email)]
}

export function discardActiveSession(email) {
  const map = readMap(ACTIVE_KEY)
  delete map[keyFor(email)]
  writeMap(ACTIVE_KEY, map)
}

// --- finished / submitted sessions -------------------------------------------

export function readFinishedSessions(email) {
  const list = readMap(FINISHED_KEY)[keyFor(email)]
  return Array.isArray(list) ? list : []
}

// Moves the completed in-flight session into the finished archive with the
// proof details attached. Returns the archived record, or null if there is no
// completed session to submit.
export function submitActiveSession(email, proof = {}) {
  const active = readActiveSession(email)
  if (!active || active.status !== 'completed') return null

  const record = {
    id: `ses_${Date.now()}`,
    name: active.name,
    focus: active.focus || null,
    drills: Array.isArray(active.drills) ? active.drills : [],
    rewards: Array.isArray(active.rewards) ? active.rewards : [],
    totalTime: active.totalTime ?? null,
    startedAt: active.startedAt || null,
    completedAt: active.completedAt || null,
    submittedAt: new Date().toISOString(),
    reviewer: proof.reviewer || 'Coach #9',
    reviewStatus: 'pending', // pending | approved | returned
    notes: proof.notes || '',
    clipName: proof.clipName || '',
    clipDurationLabel: proof.clipDurationLabel || '',
  }

  const map = readMap(FINISHED_KEY)
  const k = keyFor(email)
  map[k] = [record, ...(Array.isArray(map[k]) ? map[k] : [])]
  writeMap(FINISHED_KEY, map)

  discardActiveSession(email)
  return record
}

// --- helpers ----------------------------------------------------------------

export function timeAgo(iso) {
  if (!iso) return ''
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [label, size] of units) {
    const value = Math.floor(seconds / size)
    if (value >= 1) return `${value} ${label}${value === 1 ? '' : 's'} ago`
  }
  return 'just now'
}
