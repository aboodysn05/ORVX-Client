import client from './client'
import { codeForKey } from '../utils/attributes'

// The backend keys a drill's `boosts` by the same lowercase attribute names
// the assessment uses (pace, dribbling, ...). The session builder's internal
// logic (useSessionBuilder.js) is built around the short uppercase display
// codes (PAC, DRI, ...) instead. Rather than rewrite that logic, translate at
// the API boundary using the shared key -> code map in utils/attributes.js.
function toBuilderShape(drill) {
  const boosts = {}
  for (const [key, value] of Object.entries(drill.boosts)) {
    boosts[codeForKey(key)] = value
  }
  return {
    id: drill.id,
    name: drill.name,
    boosts,
    sets: drill.sets,
    reps: drill.reps,
    unitKind: drill.unitKind,
    perSet: drill.secondsPerSet,
  }
}

export function listDrills() {
  return client.get('/drills').then((res) => res.data.drills.map(toBuilderShape))
}

function primaryBoost(boosts) {
  const entries = Object.entries(boosts)
  if (entries.length === 0) return { code: null, value: 0 }
  const [key, value] = entries.reduce((best, entry) => (entry[1] > best[1] ? entry : best))
  return { code: codeForKey(key), value }
}

function boostString(boosts) {
  return Object.entries(boosts)
    .map(([key, value]) => `+${value} ${codeForKey(key)}`)
    .join(' · ')
}

// Shape for the public Drills Explorer page (frontend/src/pages/DrillsPage.jsx)
// — same GET /drills call as the session builder, adapted differently since
// that page shows the richer display fields (level/coach/rating/instructions)
// rather than session-builder sets/reps controls.
function toCatalogShape(drill) {
  const primary = primaryBoost(drill.boosts)
  return {
    id: drill.id,
    title: drill.name,
    statCodes: Object.keys(drill.boosts).map(codeForKey),
    stat: primary.code,
    reward: primary.code ? `+${primary.value} ${primary.code}` : '',
    rewardFull: boostString(drill.boosts),
    coach: drill.coachDisplayName,
    level: drill.level,
    focus: drill.focusLabel,
    duration: `${drill.durationMinutes} mins`,
    completes: drill.completionsCount,
    rating: drill.rating.toFixed(1),
    setup: drill.setupText,
    execution: drill.executionText,
    rule: drill.ruleText,
  }
}

export function listDrillsCatalog() {
  return client.get('/drills').then((res) => res.data.drills.map(toCatalogShape))
}
