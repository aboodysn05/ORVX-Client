import { useEffect, useMemo, useState } from 'react'
import {
  POSITION_CODE,
  RADAR_AXES,
  RADAR_CENTER,
  RADAR_RADIUS,
  attrsFor,
  demoValuesFor,
  isGoalkeeper,
  xpPairsFor,
} from '../utils/attributes'
import { readApprovedSessions, writeApprovedSessions } from '../utils/playerProfile'
import { listSessions } from '../api/sessions'
import { timeAgo } from '../utils/trainingSession'

const REVIEW_STATE = {
  approved: { state: 'approved', label: 'Approved' },
  returned: { state: 'returned', label: 'Returned' },
  pending: { state: 'pending', label: 'Pending Review' },
}

// The eight platform clubs a verified player can apply to. Static demo data —
// becomes GET /clubs once the backend exists.
export const CLUBS = [
  { name: 'Apex Academy', crest: 'AA', coach: 'Coach Marcus', squad: '11/15 Players', rank: '2nd Place', hot: true },
  { name: 'Vortex FC', crest: 'VF', coach: 'Coach Elena', squad: '13/15 Players', rank: '1st Place', hot: true },
  { name: 'Cyber Strikers', crest: 'CS', coach: 'Coach Rios', squad: '14/15 Players', rank: '4th Place' },
  { name: 'Northgate Union', crest: 'NU', coach: 'Coach Ade', squad: '12/15 Players', rank: '3rd Place' },
  { name: 'Vantage Athletic', crest: 'VA', coach: 'Coach Haas', squad: '9/15 Players', rank: '6th Place' },
  { name: 'Meridian FC', crest: 'MF', coach: 'Coach Bello', squad: '15/15 Players', rank: '5th Place', full: true },
  { name: 'Ironline SC', crest: 'IL', coach: 'Coach Novak', squad: '10/15 Players', rank: '7th Place' },
  { name: 'Halcyon Rovers', crest: 'HR', coach: 'Coach Sadiq', squad: '8/15 Players', rank: '8th Place' },
]

// Baseline training sessions a player must get approved before club
// applications unlock. Everything below (meter, milestones, copy) is derived
// from this, so it is the only number to change.
const TOTAL_SESSIONS = 1

function barColour(value) {
  if (value >= 80) return { fill: '#F59E0B', glow: 'rgba(245,158,11,0.55)' }
  if (value >= 70) return { fill: '#4F46E5', glow: 'rgba(79,70,229,0.6)' }
  return { fill: '#FF2E63', glow: 'rgba(255,46,99,0.5)' }
}

export function usePlayerDashboard(profile, email) {
  const [approved, setApprovedState] = useState(() => readApprovedSessions(email))
  const [hubOpen, setHubOpen] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [sentOpen, setSentOpen] = useState(false)
  const [finished, setFinished] = useState([])

  useEffect(() => {
    let cancelled = false
    listSessions('submitted')
      .then((data) => {
        if (!cancelled) setFinished(data)
      })
      .catch(() => {
        // No player profile yet (404) or a transient failure — leave the
        // submitted-sessions list empty rather than throwing.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const position = profile?.position || 'Attacker'
  const gk = isGoalkeeper(position)
  const attrDefs = attrsFor(position)
  const xpPairs = xpPairsFor(position)

  const values = useMemo(() => {
    const demo = demoValuesFor(position)
    const stored = profile?.attributes || {}
    return attrDefs.reduce((acc, def) => {
      const raw = Number(stored[def.key])
      acc[def.key] = Number.isFinite(raw) ? raw : demo[def.key]
      return acc
    }, {})
  }, [profile, position, attrDefs])

  const attrs = attrDefs.map((def) => {
    const value = values[def.key]
    return {
      key: def.key,
      code: def.code,
      name: def.name,
      value,
      next: `Next ${value + 2}`,
      pct: `${value}%`,
      ...barColour(value),
    }
  })

  const overall =
    Number(profile?.overall) ||
    Math.round(attrDefs.reduce((sum, def) => sum + values[def.key], 0) / attrDefs.length)

  const radarPoints = attrDefs
    .map((def, i) => {
      const r = (values[def.key] / 100) * RADAR_RADIUS
      const x = RADAR_CENTER.x + RADAR_AXES[i][0] * r
      const y = RADAR_CENTER.y + RADAR_AXES[i][1] * r
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const radarLabels = attrDefs.map((def) => `${def.code} ${values[def.key]}`)

  const remaining = TOTAL_SESSIONS - approved
  const unlocked = approved >= TOTAL_SESSIONS

  const steps = Array.from({ length: TOTAL_SESSIONS }, (_, i) => i)

  const meter = steps.map((i) => ({ done: i < approved, next: i === approved }))

  const milestones = steps.map((i) => {
    const n = i + 1
    const done = n <= approved
    const next = n === approved + 1
    const state = done ? 'done' : next ? 'next' : 'locked'
    const [a, b] = xpPairs[i]
    let detail
    if (done) detail = `+${a} / ${b} XP verified by Platform Coach`
    else if (next) detail = `Awaiting Coach #9 · unlocks +${a} / ${b} XP`
    else detail = `Opens after session ${i} is approved`
    return {
      title: `Session ${n}`,
      state,
      icon: done ? '✓' : next ? '•' : '⌁',
      status: done ? 'Approved' : next ? 'Pending Review' : 'Locked',
      detail,
    }
  })

  // Training sessions the player has finished and submitted for review,
  // newest first — fetched from GET /sessions?status=submitted above.
  const submissions = finished.slice(0, 5).map((session) => {
    const review = REVIEW_STATE[session.reviewStatus] || REVIEW_STATE.pending
    return {
      name: session.name,
      meta: `Submitted ${timeAgo(session.submittedAt)} · ${session.reviewerName || 'Unassigned'}`,
      status: review.label,
      state: review.state,
    }
  })
  const sessionsSubmitted = finished.length
  const drillsLogged = finished.reduce((sum, session) => sum + (session.drills?.length || 0), 0)

  const chosen = CLUBS[selectedClub ?? 0]

  function setApproved(n) {
    const clamped = Math.max(0, Math.min(TOTAL_SESSIONS, n))
    writeApprovedSessions(email, clamped)
    setApprovedState(clamped)
    setHubOpen(false)
    setSelectedClub(null)
  }

  return {
    // identity
    position,
    positionLabel: position,
    positionCode: POSITION_CODE[position] || 'ATT',
    footCode: profile?.dominantFoot === 'Both' ? 'L/R' : (profile?.dominantFoot || 'R').charAt(0),
    height: profile?.heightCm ?? 178,
    weight: profile?.weightKg ?? 72,
    overall,
    isGoalkeeper: gk,

    // progression
    approved,
    totalSessions: TOTAL_SESSIONS,
    remaining,
    locked: !unlocked,
    unlocked,
    lockedLabel: `Apply to Official Clubs (Locked – Complete ${remaining} more session${
      remaining === 1 ? '' : 's'
    })`,
    meterColor: unlocked ? '#22E07E' : '#F59E0B',
    meter,
    milestones,
    setApproved,

    // stat tiles
    drillsDone: drillsLogged,
    sessionsSubmitted,
    applicationsNote: unlocked
      ? 'Ready to send'
      : `Locked until ${TOTAL_SESSIONS}/${TOTAL_SESSIONS}`,
    verifyNote: unlocked ? 'Verified baseline · Season 26' : 'Provisional baseline · Season 26',
    attrSetLabel: gk ? 'Goalkeeper Set' : 'Outfield Set',

    // coach column
    submissions,

    // attributes
    attrs,
    radarPoints,
    radarLabels,

    // club application hub
    clubs: CLUBS,
    hubOpen,
    selectedClub,
    chosen,
    openHub: () => setHubOpen(true),
    closeHub: () => {
      setHubOpen(false)
      setSelectedClub(null)
    },
    selectClub: (i) => setSelectedClub(i),
    confirmSend: () => {
      setSentOpen(true)
      setHubOpen(false)
    },

    // sent confirmation
    sentOpen,
    closeSent: () => {
      setSentOpen(false)
      setSelectedClub(null)
    },
    backToHub: () => {
      setSentOpen(false)
      setHubOpen(true)
    },
  }
}
