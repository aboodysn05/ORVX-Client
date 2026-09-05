import { useEffect, useState } from 'react'
import { listDrills } from '../api/drills'

// All Session Builder logic, kept close to the design script so it is easy to
// check against. The drill catalog (`library`) is fetched from the real
// backend (GET /drills, via src/api/drills.js) on mount; everything else here
// is still local UI state. `buildHandoff()` is the seam TrainPage uses to
// call POST /sessions.

export const FOCUS_OPTIONS = [
  'Pace & Acceleration',
  'Ball Control',
  'Finishing',
  'Full Body Conditioning',
]

export const ATTR_KEYS = ['PAC', 'DRI', 'SHO', 'PAS', 'DEF', 'PHY']

const pad2 = (n) => String(n).padStart(2, '0')

function drillMinutes(base, sets, reps) {
  const seconds = base.unitKind === 'secs' ? sets * (reps + 60) : sets * base.perSet
  return Math.max(1, Math.round(seconds / 60))
}

function boostTags(boosts) {
  return ATTR_KEYS.filter((key) => boosts[key]).map((key) => `+${boosts[key]} ${key}`)
}

export function useSessionBuilder() {
  const [sessionName, setSessionName] = useState('Tuesday High-Intensity Speed & Dribbling')
  const [focus, setFocus] = useState(FOCUS_OPTIONS[0])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(null) // one ATTR_KEY or null
  const [items, setItems] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listDrills()
      .then((drills) => {
        if (!cancelled) setLibrary(drills)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const libOf = (id) => library.find((drill) => drill.id === id)

  function step(uid, field, delta) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item
        const base = libOf(item.ref)
        const secondsReps = field === 'reps' && base.unitKind === 'secs'
        const min = secondsReps ? 5 : 1
        const max = field === 'reps' ? (secondsReps ? 120 : 20) : 5
        return { ...item, [field]: Math.min(max, Math.max(min, item[field] + delta)) }
      }),
    )
  }

  const playlist = items.map((item, index) => {
    const base = libOf(item.ref)
    const repDelta = base.unitKind === 'secs' ? 5 : 1
    return {
      uid: item.uid,
      pos: pad2(index + 1),
      name: base.name,
      tags: boostTags(base.boosts),
      repLabel: base.unitKind === 'secs' ? 'Secs' : 'Reps',
      unitText: `${item.sets} Sets × ${item.reps}${base.unitKind === 'secs' ? 's' : ' Reps'}`,
      sets: item.sets,
      reps: item.reps,
      timeLabel: `${drillMinutes(base, item.sets, item.reps)}m`,
      incSets: () => step(item.uid, 'sets', 1),
      decSets: () => step(item.uid, 'sets', -1),
      incReps: () => step(item.uid, 'reps', repDelta),
      decReps: () => step(item.uid, 'reps', -repDelta),
      remove: () => setItems((prev) => prev.filter((other) => other.uid !== item.uid)),
    }
  })

  const totalTime = items.reduce(
    (sum, item) => sum + drillMinutes(libOf(item.ref), item.sets, item.reps),
    0,
  )

  const totals = {}
  items.forEach((item) => {
    const { boosts } = libOf(item.ref)
    ATTR_KEYS.forEach((key) => {
      if (boosts[key]) totals[key] = (totals[key] || 0) + boosts[key]
    })
  })
  const gains = ATTR_KEYS.filter((key) => totals[key]).map((key) => `+${totals[key]} ${key}`)
  const gainsLine = gains.length ? gains.join('  |  ') : 'No drills selected'

  const q = query.trim().toLowerCase()
  const catalog = library
    .filter((drill) => !q || drill.name.toLowerCase().includes(q))
    .filter((drill) => !filter || drill.boosts[filter])
    .map((drill) => ({
      id: drill.id,
      name: drill.name,
      tags: boostTags(drill.boosts),
      metaText: `${drill.sets} × ${drill.reps}${drill.unitKind === 'secs' ? 's' : ''} · ${drillMinutes(
        drill,
        drill.sets,
        drill.reps,
      )}m`,
      inSession: items.some((item) => item.ref === drill.id),
      add: () =>
        setItems((prev) =>
          prev.some((item) => item.ref === drill.id)
            ? prev
            : [...prev, { uid: `${drill.id}-${Date.now()}`, ref: drill.id, sets: drill.sets, reps: drill.reps }],
        ),
    }))

  const pills = ATTR_KEYS.map((key) => ({ key, active: filter === key }))

  function buildHandoff() {
    return {
      name: sessionName,
      focus,
      totalTime,
      rewards: gains,
      // Display-only drill list (used by the summary card before submit).
      drills: items.map((item) => {
        const base = libOf(item.ref)
        return {
          name: base.name,
          boost: boostTags(base.boosts).join(' · '),
          sets: item.sets,
          reps: item.reps,
          unit: base.unitKind === 'secs' ? 'Secs' : 'Reps',
        }
      }),
      // What POST /sessions actually needs: real drill ids so the backend can
      // look up the canonical name/boosts itself rather than trust ours.
      drillPayload: items.map((item) => ({ drillId: item.ref, sets: item.sets, reps: item.reps })),
    }
  }

  return {
    sessionName,
    setSessionName,
    focus,
    setFocus,
    focusOptions: FOCUS_OPTIONS,
    query,
    setQuery,
    pills,
    toggleFilter: (key) => setFilter((current) => (current === key ? null : key)),
    playlist,
    isEmpty: items.length === 0,
    count: pad2(items.length),
    totalTime,
    gains,
    gainsLine,
    catalog,
    catalogCount: pad2(catalog.length),
    noResults: !loading && catalog.length === 0,
    loading,
    buildHandoff,
  }
}
