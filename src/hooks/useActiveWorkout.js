import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import {
  completeSession,
  discardActiveSession,
  readActiveSession,
  saveSessionProgress,
  timeAgo,
} from '../utils/trainingSession'

function clock(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function blankMatrix(drills) {
  return drills.map((drill) => Array(Math.max(1, drill.sets || 1)).fill(false))
}

// Reconcile a stored progress matrix against the session's drills so a shape
// change (or corruption) can't crash the checklist.
function hydrateMatrix(drills, stored) {
  const base = blankMatrix(drills)
  if (!Array.isArray(stored)) return base
  return base.map((row, di) =>
    row.map((_, si) => Boolean(Array.isArray(stored[di]) ? stored[di][si] : false)),
  )
}

// Active Workout HUD logic. The session comes from the lifecycle store, not a
// loose draft: if there is none the page redirects to the builder, and once the
// session is `completed` the checklist is locked — the only way forward is to
// submit proof (or discard and rebuild).
export function useActiveWorkout() {
  const { user } = useAuth()
  const email = user?.email

  const session = useMemo(() => readActiveSession(email), [email])
  const locked = session?.status === 'completed'

  const [done, setDone] = useState(() =>
    session ? hydrateMatrix(session.drills, session.progress) : [],
  )
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!session || locked) return undefined
    const id = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [session, locked])

  // Persist the checklist so a reload mid-workout keeps progress.
  useEffect(() => {
    if (!session || locked) return
    saveSessionProgress(email, done)
  }, [done, session, locked, email])

  if (!session) {
    return { missing: true }
  }

  if (locked) {
    return {
      locked: true,
      sessionTitle: session.name,
      completedAgo: timeAgo(session.completedAt),
      drillTotal: session.drills.length,
      rewards: session.rewards?.length ? session.rewards : ['No XP targeted'],
      discard: () => discardActiveSession(email),
    }
  }

  function toggleSet(drillIndex, setIndex) {
    setDone((prev) =>
      prev.map((row, di) =>
        di === drillIndex ? row.map((value, si) => (si === setIndex ? !value : value)) : row,
      ),
    )
  }

  const drillComplete = done.map((row) => row.every(Boolean))
  const drillsDone = drillComplete.filter(Boolean).length
  const setsTotal = done.reduce((sum, row) => sum + row.length, 0)
  const setsDone = done.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
  const allDone = setsTotal > 0 && setsDone === setsTotal
  const activeIndex = drillComplete.indexOf(false)
  const pct = setsTotal ? Math.round((setsDone / setsTotal) * 100) : 0
  const remaining = setsTotal - setsDone

  const drills = session.drills.map((drill, di) => {
    const complete = drillComplete[di]
    const active = di === activeIndex
    return {
      key: `${drill.name}-${di}`,
      n: di + 1,
      name: drill.name,
      boost: drill.boost,
      state: complete ? 'complete' : active ? 'active' : 'upcoming',
      statusLabel: complete ? 'Completed' : active ? 'In Progress' : 'Upcoming',
      showGuidance: active,
      sets: done[di].map((checked, si) => ({
        key: si,
        label: `Set ${si + 1}: ${drill.reps} ${drill.unit}`,
        done: checked,
        state: checked ? 'done' : active ? 'active' : 'pending',
        stateLabel: checked ? 'Completed' : active ? 'Click to mark done' : 'Pending',
        toggle: () => toggleSet(di, si),
      })),
    }
  })

  return {
    elapsed: clock(elapsed),
    sessionTitle: session.name,
    rewards: session.rewards?.length ? session.rewards : ['No XP targeted'],
    drillsDone,
    drillTotal: session.drills.length,
    setsDone,
    setsTotal,
    progressPct: `${pct}%`,
    progressLabel: `${pct}% of sets ticked`,
    allDone,
    finishLockedLabel: `Finish Workout (Locked – ${remaining} set${remaining === 1 ? '' : 's'} left)`,
    drills,
    // Lock the session, then the page routes on to proof submission.
    finish: () => completeSession(email),
    cancel: () => discardActiveSession(email),
  }
}
