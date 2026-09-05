import { useEffect, useState } from 'react'
import { completeSession, discardSession, getActiveSession, saveProgress } from '../api/sessions'
import { timeAgo } from '../utils/trainingSession'

function clock(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// The backend stores each drill's per-set checklist on its own
// session_drills row (drill.progress), rather than one matrix on the
// session. Reconcile each row against its own `sets` count so a shape drift
// (or a drill added mid-flight some other way) can't crash the checklist —
// same defensive intent the old single-matrix version had.
function hydrateMatrix(drills) {
  return drills.map((drill) => {
    const size = Math.max(1, drill.sets || 1)
    return Array.from({ length: size }, (_, si) => Boolean(drill.progress?.[si]))
  })
}

// Active Workout HUD logic. The session comes from the backend (one player
// has at most one in-flight session — see the partial unique index on
// training_sessions): if there is none the page redirects, and once the
// session is `completed` the checklist is locked — the only way forward is
// to submit proof (or discard and rebuild).
export function useActiveWorkout() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState([])
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let cancelled = false
    getActiveSession().then((data) => {
      if (cancelled) return
      setSession(data)
      setDone(data ? hydrateMatrix(data.drills) : [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const locked = session?.status === 'completed'

  useEffect(() => {
    if (!session || locked) return undefined
    const id = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [session, locked])

  // Persist the checklist so a reload mid-workout keeps progress — same
  // intent as before, now a PATCH instead of a localStorage write. Skips the
  // very first render (done is only just-hydrated from the session then).
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (!session || locked) return
    if (!hydrated) {
      setHydrated(true)
      return
    }
    saveProgress(session.id, done).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire on `done` changes only
  }, [done])

  if (loading) {
    return { loading: true }
  }

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
      discard: () => discardSession(session.id),
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
    // The backend re-verifies every set is actually ticked before allowing
    // completion (409 SESSION_INCOMPLETE otherwise) — it's the real gate,
    // this `allDone` check is just what disables the button in the UI.
    finish: () => completeSession(session.id),
    cancel: () => discardSession(session.id),
  }
}
