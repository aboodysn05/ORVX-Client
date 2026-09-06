import { useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { attrsFor } from '../utils/attributes'
import { tierFor } from '../hooks/usePlayerAssessment'
import '../styles/evaluator-console.css'

// Platform Evaluator workspace ("Coach #9"). The evaluator runs NO club. Every
// player who finishes the self-assessment must get ONE baseline training
// session approved before any club can see or sign them — the same single-
// session rule the player side enforces (hooks/useSubmitProof.js
// BASELINE_TARGET = 1, hooks/usePlayerDashboard.js TOTAL_SESSIONS = 1).
//
// The process is deliberately simple: for each waiting player the evaluator
// tweaks the self-rated card to verified values if needed, then hits Approve
// (released to the club scouting pool) or Reject. No multi-step states.
//
// Frontend only: mock pool + local state for the verdict, per-attribute
// verified overrides and a toast. Clip playback lives in the shared Review
// Queue (/coach/review, evaluator mode).

// selfAttrs are keyed by the lowercase attribute key (pace, dribbling, …),
// same as the assessment wizard stores them.
const POOL = [
  {
    id: 'pl-1', name: 'J. Adeyemi', initials: 'JA', position: 'Attacker', height: 178, weight: 72, daysInPool: 6,
    selfAttrs: { pace: 84, shooting: 78, passing: 70, dribbling: 80, defending: 55, physical: 68 },
    context: 'Sprint Ladder 40m · +2 PAC',
  },
  {
    id: 'pl-2', name: 'L. Moreau', initials: 'LM', position: 'Defender', height: 185, weight: 80, daysInPool: 4,
    selfAttrs: { pace: 66, shooting: 52, passing: 71, dribbling: 63, defending: 82, physical: 79 },
    context: 'Jockey & Recover · +2 DEF',
  },
  {
    id: 'pl-3', name: 'T. Okonkwo', initials: 'TO', position: 'Attacker', height: 174, weight: 68, daysInPool: 9,
    selfAttrs: { pace: 79, shooting: 74, passing: 66, dribbling: 83, defending: 48, physical: 61 },
    context: 'Cone Weave 20m · +2 DRI',
  },
  {
    id: 'pl-4', name: 'K. Ibarra', initials: 'KI', position: 'Goalkeeper', height: 190, weight: 84, daysInPool: 2,
    selfAttrs: { diving: 78, handling: 74, kicking: 66, reflexes: 82, speed: 61, positioning: 73 },
    context: 'Reaction Save Drill · +3 REF',
  },
  {
    id: 'pl-5', name: 'S. Novak', initials: 'SN', position: 'Defender', height: 183, weight: 78, daysInPool: 1,
    selfAttrs: { pace: 70, shooting: 55, passing: 68, dribbling: 60, defending: 76, physical: 74 },
    context: 'Wall Pass Rebound · +1 PAS',
    seedVerdict: 'approved',
  },
  {
    id: 'pl-6', name: 'D. Ferreira', initials: 'DF', position: 'Goalkeeper', height: 188, weight: 82, daysInPool: 12,
    selfAttrs: { diving: 81, handling: 79, kicking: 70, reflexes: 84, speed: 58, positioning: 77 },
    context: 'Low Dive Recovery · +2 DIV',
    seedVerdict: 'rejected',
  },
]

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected']
const STATUS = {
  pending: { label: 'Pending Review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'pink' },
}

const avg = (nums) => Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
const selfOvrOf = (p) => avg(Object.values(p.selfAttrs))

export function EvaluatorConsolePage() {
  const [decisions, setDecisions] = useState(() =>
    Object.fromEntries(POOL.filter((p) => p.seedVerdict).map((p) => [p.id, { verdict: p.seedVerdict }])),
  )
  const [verified, setVerified] = useState({}) // playerId -> { key: value }
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('pl-1')
  const [toast, setToast] = useState('')
  const [releasedThisWeek, setReleasedThisWeek] = useState(5)

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2800)
  }

  const verdictOf = (id) => decisions[id]?.verdict || 'pending'

  const rows = POOL.map((p) => ({
    ...p,
    verdict: verdictOf(p.id),
    selfOvr: selfOvrOf(p),
  }))

  const visible = rows.filter((r) => {
    if (query.trim() && !r.name.toLowerCase().includes(query.trim().toLowerCase())) return false
    if (filter === 'All') return true
    return STATUS[r.verdict].label.startsWith(filter)
  })

  const sel = rows.find((r) => r.id === selectedId) || null
  const selAttrs = sel ? attrsFor(sel.position) : []

  const vals =
    sel && verified[sel.id]
      ? verified[sel.id]
      : sel
        ? Object.fromEntries(selAttrs.map((a) => [a.key, sel.selfAttrs[a.key]]))
        : {}
  const verifiedOvr = selAttrs.length ? avg(selAttrs.map((a) => vals[a.key])) : 0
  const verifiedTier = tierFor(verifiedOvr)

  function selectPlayer(id) {
    setSelectedId(id)
    const p = POOL.find((x) => x.id === id)
    if (p && !verified[id]) {
      setVerified((v) => ({
        ...v,
        [id]: Object.fromEntries(attrsFor(p.position).map((a) => [a.key, p.selfAttrs[a.key]])),
      }))
    }
  }

  function nudge(key, delta) {
    setVerified((v) => {
      const cur = v[sel.id] || Object.fromEntries(selAttrs.map((a) => [a.key, sel.selfAttrs[a.key]]))
      return { ...v, [sel.id]: { ...cur, [key]: Math.max(1, Math.min(99, cur[key] + delta)) } }
    })
  }

  function approve() {
    if (!sel) return
    setDecisions((d) => ({
      ...d,
      [sel.id]: { verdict: 'approved', ovr: verifiedOvr, tier: verifiedTier.name },
    }))
    setReleasedThisWeek((n) => n + 1)
    fire(`${sel.name} approved · released to the club scouting pool`)
  }
  function reject() {
    if (!sel) return
    setDecisions((d) => ({ ...d, [sel.id]: { verdict: 'rejected' } }))
    fire(`${sel.name}'s baseline rejected · player asked to resubmit`)
  }
  function undo() {
    setDecisions((d) => {
      const next = { ...d }
      delete next[sel.id]
      return next
    })
    fire(`${sel.name} back to pending`)
  }

  const pendingCount = rows.filter((r) => r.verdict === 'pending').length
  const approvedCount = rows.filter((r) => r.verdict === 'approved').length
  const rejectedCount = rows.filter((r) => r.verdict === 'rejected').length

  return (
    <PageShell>
      <section className="evc-section">
        <div className="evc-head">
          <div className="evc-head__copy">
            <span className="evc-kicker">Platform Evaluator · Coach #9 · No Club</span>
            <h1 className="evc-title">Baseline Evaluation Console</h1>
            <p className="evc-lead">
              Every new player runs one baseline training session that no club can see yet. Check the
              self-assessed card, adjust any rating that needs it, then Approve to release the player
              into the club scouting pool — or Reject. You don't run a club; your job ends when the
              player is released.
            </p>
          </div>
        </div>

        <div className="evc-stats">
          <div className="evc-stat evc-stat--amber">
            <span className="evc-stat__k">Pending Review</span>
            <span className="evc-stat__v">{pendingCount}</span>
            <span className="evc-stat__note">Waiting on a verdict</span>
          </div>
          <div className="evc-stat evc-stat--green">
            <span className="evc-stat__k">Approved</span>
            <span className="evc-stat__v">{approvedCount}</span>
            <span className="evc-stat__note">Released to scouting</span>
          </div>
          <div className="evc-stat evc-stat--pink">
            <span className="evc-stat__k">Rejected</span>
            <span className="evc-stat__v">{rejectedCount}</span>
            <span className="evc-stat__note">Asked to resubmit</span>
          </div>
          <div className="evc-stat">
            <span className="evc-stat__k">Released This Week</span>
            <span className="evc-stat__v">{releasedThisWeek}</span>
            <span className="evc-stat__note">Now scoutable by clubs</span>
          </div>
        </div>
      </section>

      <section className="evc-body">
        <div className="evc-pool">
          <div className="evc-pool__bar">
            <label className="evc-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Search player…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="evc-filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`evc-chip ${filter === f ? 'is-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {visible.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`evc-prow ${selectedId === r.id ? 'is-selected' : ''}`}
              onClick={() => selectPlayer(r.id)}
            >
              <span className="evc-avatar">{r.initials}</span>
              <span className="evc-prow__id">
                <span className="evc-prow__name">{r.name}</span>
                <span className="evc-prow__meta">
                  {r.position} · self OVR {r.selfOvr} · {r.daysInPool}d in pool
                </span>
              </span>
              <span className={`evc-statuspill evc-statuspill--${STATUS[r.verdict].tone}`}>
                {STATUS[r.verdict].label}
              </span>
            </button>
          ))}

          {visible.length === 0 && (
            <div className="evc-empty">
              <span className="evc-empty__title">No players</span>
              <span className="evc-empty__note">Nothing matches this filter.</span>
            </div>
          )}
        </div>

        <div className="evc-detail">
          {!sel ? (
            <div className="evc-noactive">
              <span className="evc-noactive__title">No player selected</span>
              <span className="evc-noactive__note">Pick a player from the pool to review their baseline.</span>
            </div>
          ) : (
            <>
              <div className="evc-detail__head">
                <span className="evc-avatar evc-avatar--lg">{sel.initials}</span>
                <span className="evc-detail__id">
                  <span className="evc-detail__name">{sel.name}</span>
                  <span className="evc-detail__meta">
                    {sel.position} · {sel.height} cm · {sel.weight} kg
                  </span>
                </span>
                <span className="evc-detail__ovr">
                  <span className="evc-detail__ovr-v">{sel.selfOvr}</span>
                  <span className="evc-detail__ovr-l">Self OVR</span>
                </span>
              </div>

              <span className="evc-context">
                Baseline session · {sel.context} · clip in Review Queue
              </span>

              {sel.verdict !== 'pending' ? (
                <div className={`evc-verdict is-${sel.verdict}`}>
                  <span className="evc-verdict__row">
                    {sel.verdict === 'approved' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M4 12l5 5L20 6" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    )}
                    <span>
                      {sel.verdict === 'approved'
                        ? `Approved at OVR ${decisions[sel.id].ovr} (${decisions[sel.id].tier}). ${sel.name} is now scoutable by club coaches.`
                        : `Baseline rejected. ${sel.name} has been asked to record and submit a new session.`}
                    </span>
                  </span>
                  <button type="button" className="evc-undo" onClick={undo}>
                    Undo
                  </button>
                </div>
              ) : (
                <>
                  <div className="evc-block">
                    <span className="evc-block__label">
                      Verified Starting Card
                      <span className="evc-block__count evc-block__count--muted">
                        adjust only what's off
                      </span>
                    </span>
                    <div className="evc-attrs">
                      {selAttrs.map((a) => {
                        const self = sel.selfAttrs[a.key]
                        const v = vals[a.key]
                        const delta = v - self
                        return (
                          <div key={a.key} className="evc-attr">
                            <span className="evc-attr__top">
                              <span className="evc-attr__code">{a.code}</span>
                              <span className="evc-attr__self">self {self}</span>
                            </span>
                            <span className="evc-attr__stepper">
                              <button type="button" aria-label={`Lower ${a.name}`} onClick={() => nudge(a.key, -1)}>
                                −
                              </button>
                              <span className="evc-attr__v">{v}</span>
                              <button type="button" aria-label={`Raise ${a.name}`} onClick={() => nudge(a.key, 1)}>
                                +
                              </button>
                            </span>
                            <span
                              className={`evc-attr__delta ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}`}
                            >
                              {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '—'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="evc-certfoot">
                    <span className="evc-verified">
                      <span className="evc-verified__k">Verified OVR</span>
                      <span className="evc-verified__v" style={{ color: verifiedTier.color }}>
                        {verifiedOvr}
                        <span className="evc-verified__tier">{verifiedTier.name}</span>
                      </span>
                    </span>
                    <span className="evc-actions">
                      <button type="button" className="evc-rejectbtn" onClick={reject}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                        Reject
                      </button>
                      <button type="button" className="evc-certbtn" onClick={approve}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Approve &amp; Release
                      </button>
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {toast && (
        <div className="evc-toast">
          <span className="evc-toast__dot" />
          <span className="evc-toast__msg">{toast}</span>
        </div>
      )}
    </PageShell>
  )
}
