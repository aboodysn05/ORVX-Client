import { useEffect, useMemo, useState } from 'react'

// Used when the player opens /workout without a session stashed by the
// Session Builder — the same demo session the design ships with.
const FALLBACK_SESSION = {
  name: 'Tuesday High-Intensity Speed & Dribbling',
  rewards: ['+3 PAC', '+2 DRI'],
  drills: [
    { name: 'Cone Slalom Agility Weave', boost: '+2 PAC', sets: 3, reps: 15, unit: 'Reps' },
    { name: 'Tight-Space 1v1 Dribbling', boost: '+2 DRI', sets: 3, reps: 20, unit: 'Secs' },
    { name: 'Box-to-Box Sprint Drills', boost: '+1 PHY', sets: 4, reps: 15, unit: 'Secs' },
  ],
}

function loadSession() {
  try {
    const raw = localStorage.getItem('orvx_session')
    if (!raw) return FALLBACK_SESSION
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.drills) || parsed.drills.length === 0) {
      return FALLBACK_SESSION
    }
    return parsed
  } catch {
    return FALLBACK_SESSION
  }
}

function clock(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// Active Workout HUD logic: a running stopwatch plus a per-set checklist.
// The session is read once on mount; ticking each set drives every derived
// figure below.
export function useActiveWorkout() {
  const session = useMemo(() => loadSession(), [])
  const [done, setDone] = useState(() =>
    session.drills.map((drill) => Array(Math.max(1, drill.sets || 1)).fill(false)),
  )
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(id)
  }, [])

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
  const activeIndex = drillComplete.indexOf(false) // first unfinished drill, or -1
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
    sessionTitle: session.name || FALLBACK_SESSION.name,
    rewards: session.rewards && session.rewards.length ? session.rewards : ['No XP targeted'],
    drillsDone,
    drillTotal: session.drills.length,
    setsDone,
    setsTotal,
    progressPct: `${pct}%`,
    progressLabel: `${pct}% of sets ticked`,
    allDone,
    finishLockedLabel: `Finish Workout (Locked – ${remaining} set${remaining === 1 ? '' : 's'} left)`,
    drills,
  }
}
