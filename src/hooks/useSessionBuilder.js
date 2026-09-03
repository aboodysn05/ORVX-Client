import { useState } from 'react'

// All Session Builder logic, kept close to the design script so it is easy to
// check against. Everything is local state for now; `buildHandoff()` is the
// single seam that becomes a POST to /sessions once the backend exists.

export const FOCUS_OPTIONS = [
  'Pace & Acceleration',
  'Ball Control',
  'Finishing',
  'Full Body Conditioning',
]

export const ATTR_KEYS = ['PAC', 'DRI', 'SHO', 'PAS', 'DEF', 'PHY']

// Drill catalog. `perSet` is seconds per set for rep-based drills; time for
// seconds-based drills is derived from the seconds value instead.
const LIBRARY = [
  { id: 'slalom', name: 'Cone Slalom Agility Weave', boosts: { PAC: 2 }, sets: 3, reps: 5, unitKind: 'reps', perSet: 200 },
  { id: 'onev1', name: 'Tight-Space 1v1 Dribbling', boosts: { DRI: 2 }, sets: 4, reps: 3, unitKind: 'reps', perSet: 225 },
  { id: 'box', name: 'Box-to-Box Sprint Drills', boosts: { PHY: 1, PAC: 1 }, sets: 5, reps: 30, unitKind: 'secs', perSet: 120 },
  { id: 'wall', name: 'Wall-Pass Rebound Control', boosts: { PAS: 2 }, sets: 4, reps: 12, unitKind: 'reps', perSet: 150 },
  { id: 'finish', name: 'First-Touch Finishing Volley', boosts: { SHO: 2 }, sets: 3, reps: 8, unitKind: 'reps', perSet: 200 },
  { id: 'ladder', name: 'Speed Ladder Quick Feet', boosts: { PAC: 1, DRI: 1 }, sets: 4, reps: 20, unitKind: 'secs', perSet: 90 },
  { id: 'shield', name: 'Shielding & Shoulder Duels', boosts: { PHY: 2 }, sets: 3, reps: 6, unitKind: 'reps', perSet: 180 },
  { id: 'press', name: 'Recovery Press & Tackle Angles', boosts: { DEF: 2 }, sets: 4, reps: 6, unitKind: 'reps', perSet: 165 },
  { id: 'chip', name: 'Long-Range Chip Accuracy', boosts: { PAS: 1, SHO: 1 }, sets: 3, reps: 10, unitKind: 'reps', perSet: 200 },
  { id: 'turn', name: 'Cruyff Turn Repetition Set', boosts: { DRI: 2 }, sets: 4, reps: 8, unitKind: 'reps', perSet: 135 },
]

const DEFAULT_ITEMS = [
  { uid: 'i1', ref: 'slalom', sets: 3, reps: 5 },
  { uid: 'i2', ref: 'onev1', sets: 4, reps: 3 },
  { uid: 'i3', ref: 'box', sets: 5, reps: 30 },
]

const libOf = (id) => LIBRARY.find((drill) => drill.id === id)
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
  const [items, setItems] = useState(DEFAULT_ITEMS)

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
  const catalog = LIBRARY.filter((drill) => !q || drill.name.toLowerCase().includes(q))
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
    noResults: catalog.length === 0,
    buildHandoff,
  }
}
