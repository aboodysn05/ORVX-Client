import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { attrsFor } from '../utils/attributes'
import { tierFor } from '../hooks/usePlayerAssessment'
import { getReviewQueue, reviewSubmission } from '../api/review'
import '../styles/evaluator-console.css'

// Platform Evaluator workspace ("Coach #9"). Reads the live baseline review
// queue from GET /review/queue: every new player's single baseline submission,
// pending a verdict. The evaluator adjusts the self-rated card where needed,
// then Approves (releases the player to the club scouting pool, crediting the
// verified values or the drill boosts) or Rejects. Once decided a submission
// leaves the queue — there is no undo on the server.

const avg = (nums) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0)

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase()
}

function contextLine(item) {
  const drill = item.drills?.[0]
  const rewards = Object.entries(item.projectedRewards || {})
    .map(([code, v]) => `+${v} ${code.slice(0, 3).toUpperCase()}`)
    .join(' · ')
  return [drill?.name, rewards].filter(Boolean).join(' · ') || 'Baseline session'
}

function daysAgo(iso) {
  if (!iso) return 0
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))
}

export function EvaluatorConsolePage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [verified, setVerified] = useState({}) // submissionId -> { key: value }
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [tally, setTally] = useState({ approved: 0, rejected: 0 })
  const [busy, setBusy] = useState(false)

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2800)
  }

  function load() {
    setLoading(true)
    getReviewQueue()
      .then((rows) => {
        setQueue(rows)
        setError('')
        setSelectedId((cur) => (rows.some((r) => r.id === cur) ? cur : rows[0]?.id ?? null))
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load the review queue.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? queue.filter((r) => r.player.name.toLowerCase().includes(q)) : queue
  }, [queue, query])

  const sel = queue.find((r) => r.id === selectedId) || null
  const selAttrs = sel ? attrsFor(sel.player.position) : []
  const selfAttrs = sel?.player.attributes || {}

  const vals =
    sel && verified[sel.id]
      ? verified[sel.id]
      : Object.fromEntries(selAttrs.map((a) => [a.key, selfAttrs[a.key] ?? 0]))
  const verifiedOvr = selAttrs.length ? avg(selAttrs.map((a) => vals[a.key] ?? 0)) : 0
  const verifiedTier = tierFor(verifiedOvr)

  function selectPlayer(id) {
    setSelectedId(id)
    if (!verified[id]) {
      const item = queue.find((r) => r.id === id)
      if (item) {
        setVerified((v) => ({
          ...v,
          [id]: Object.fromEntries(
            attrsFor(item.player.position).map((a) => [a.key, item.player.attributes[a.key] ?? 0]),
          ),
        }))
      }
    }
  }

  function nudge(key, delta) {
    setVerified((v) => {
      const cur = v[sel.id] || Object.fromEntries(selAttrs.map((a) => [a.key, selfAttrs[a.key] ?? 0]))
      return { ...v, [sel.id]: { ...cur, [key]: Math.max(1, Math.min(99, (cur[key] ?? 0) + delta)) } }
    })
  }

  async function decide(verdict) {
    if (!sel || busy) return
    setBusy(true)
    // Only send overrides that actually differ from the self-assessed value —
    // an untouched approve lets the backend credit the drill boosts instead.
    const overrides = {}
    for (const a of selAttrs) {
      if ((vals[a.key] ?? 0) !== (selfAttrs[a.key] ?? 0)) overrides[a.key] = vals[a.key]
    }
    try {
      const res = await reviewSubmission(sel.id, {
        verdict,
        verifiedAttributes: verdict === 'approved' && Object.keys(overrides).length ? overrides : undefined,
      })
      const name = sel.player.name
      setQueue((rows) => rows.filter((r) => r.id !== sel.id))
      setTally((t) => ({ ...t, [verdict]: t[verdict] + 1 }))
      setSelectedId((cur) => {
        const rest = queue.filter((r) => r.id !== sel.id)
        return cur === sel.id ? rest[0]?.id ?? null : cur
      })
      fire(
        verdict === 'approved'
          ? `${name} approved at OVR ${res.player?.overall ?? verifiedOvr} · released to scouting`
          : `${name}'s baseline rejected · asked to resubmit`,
      )
    } catch (err) {
      fire(err.response?.data?.message || 'That verdict could not be recorded.')
    } finally {
      setBusy(false)
    }
  }

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
              into the club scouting pool — or Reject.
            </p>
          </div>
        </div>

        <div className="evc-stats">
          <div className="evc-stat evc-stat--amber">
            <span className="evc-stat__k">Pending Review</span>
            <span className="evc-stat__v">{queue.length}</span>
            <span className="evc-stat__note">Waiting on a verdict</span>
          </div>
          <div className="evc-stat evc-stat--green">
            <span className="evc-stat__k">Approved</span>
            <span className="evc-stat__v">{tally.approved}</span>
            <span className="evc-stat__note">This session</span>
          </div>
          <div className="evc-stat evc-stat--pink">
            <span className="evc-stat__k">Rejected</span>
            <span className="evc-stat__v">{tally.rejected}</span>
            <span className="evc-stat__note">This session</span>
          </div>
          <div className="evc-stat">
            <span className="evc-stat__k">Released</span>
            <span className="evc-stat__v">{tally.approved}</span>
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
          </div>

          {loading && <div className="evc-empty"><span className="evc-empty__note">Loading queue…</span></div>}
          {error && !loading && <div className="evc-empty"><span className="evc-empty__title">Couldn't load</span><span className="evc-empty__note">{error}</span></div>}

          {!loading && !error && visible.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`evc-prow ${selectedId === r.id ? 'is-selected' : ''}`}
              onClick={() => selectPlayer(r.id)}
            >
              <span className="evc-avatar">{initialsOf(r.player.name)}</span>
              <span className="evc-prow__id">
                <span className="evc-prow__name">{r.player.name}</span>
                <span className="evc-prow__meta">
                  {r.player.position} · self OVR {r.player.overall} · {daysAgo(r.submittedAt)}d in pool
                </span>
              </span>
              <span className="evc-statuspill evc-statuspill--amber">Pending Review</span>
            </button>
          ))}

          {!loading && !error && visible.length === 0 && (
            <div className="evc-empty">
              <span className="evc-empty__title">Queue clear</span>
              <span className="evc-empty__note">No baseline submissions are waiting.</span>
            </div>
          )}
        </div>

        <div className="evc-detail">
          {!sel ? (
            <div className="evc-noactive">
              <span className="evc-noactive__title">No player selected</span>
              <span className="evc-noactive__note">Pick a player from the queue to review their baseline.</span>
            </div>
          ) : (
            <>
              <div className="evc-detail__head">
                <span className="evc-avatar evc-avatar--lg">{initialsOf(sel.player.name)}</span>
                <span className="evc-detail__id">
                  <span className="evc-detail__name">{sel.player.name}</span>
                  <span className="evc-detail__meta">
                    {sel.player.position} · {sel.player.heightCm} cm · {sel.player.weightKg} kg
                  </span>
                </span>
                <span className="evc-detail__ovr">
                  <span className="evc-detail__ovr-v">{sel.player.overall}</span>
                  <span className="evc-detail__ovr-l">Self OVR</span>
                </span>
              </div>

              <span className="evc-context">Baseline session · {contextLine(sel)} · clip in Review Queue</span>

              <div className="evc-block">
                <span className="evc-block__label">
                  Verified Starting Card
                  <span className="evc-block__count evc-block__count--muted">adjust only what's off</span>
                </span>
                <div className="evc-attrs">
                  {selAttrs.map((a) => {
                    const self = selfAttrs[a.key] ?? 0
                    const v = vals[a.key] ?? 0
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
                        <span className={`evc-attr__delta ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}`}>
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
                  <button type="button" className="evc-rejectbtn" disabled={busy} onClick={() => decide('rejected')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                    Reject
                  </button>
                  <button type="button" className="evc-certbtn" disabled={busy} onClick={() => decide('approved')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Approve &amp; Release
                  </button>
                </span>
              </div>
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
