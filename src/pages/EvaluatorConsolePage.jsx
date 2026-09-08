import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { attrsFor } from '../utils/attributes'
import { tierFor } from '../hooks/usePlayerAssessment'
import { getReviewQueue, getReviewStats, reviewSubmission } from '../api/review'
import '../styles/evaluator-console.css'

// Platform Evaluator workspace. Reads the live baseline review
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

const CODE_ABBR = {
  pace: 'PAC', shooting: 'SHO', passing: 'PAS', dribbling: 'DRI', defending: 'DEF', physical: 'PHY',
  diving: 'DIV', handling: 'HAN', kicking: 'KIC', reflexes: 'REF', speed: 'SPD', positioning: 'POS',
}
const shortCode = (key) => CODE_ABBR[key] || key.slice(0, 3).toUpperCase()

function creditLine(credited) {
  const parts = Object.entries(credited || {}).map(([code, v]) => `+${v} ${shortCode(code)}`)
  return parts.length ? ` · ${parts.join(' ')} credited` : ''
}

function formatWhen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

// The submitted clip. Real file storage doesn't exist yet, so a URL that isn't
// a playable video is shown as a link rather than a dead <video> element.
function ClipPlayer({ url }) {
  const playable = typeof url === 'string' && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
  if (!url) {
    return (
      <div className="evc-clip evc-clip--empty">
        <span className="evc-clip__title">No clip attached</span>
        <span className="evc-clip__note">This submission arrived without a video proof.</span>
      </div>
    )
  }
  if (!playable) {
    return (
      <div className="evc-clip evc-clip--empty">
        <span className="evc-clip__title">Clip stored as a link</span>
        <span className="evc-clip__note">
          File storage isn't wired up yet, so the proof is a URL:
        </span>
        <a className="evc-clip__url" href={url} target="_blank" rel="noreferrer noopener">
          {url}
        </a>
      </div>
    )
  }
  return <video className="evc-clip__video" src={url} controls preload="metadata" playsInline />
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
  const [stats, setStats] = useState(null) // lifetime review totals from GET /review/stats
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  function refreshStats() {
    getReviewStats()
      .then(setStats)
      .catch(() => {})
  }

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
    refreshStats()
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
    setFeedback('')
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
        feedback: feedback.trim() || undefined,
        verifiedAttributes: verdict === 'approved' && Object.keys(overrides).length ? overrides : undefined,
      })
      const name = sel.player.name
      setQueue((rows) => rows.filter((r) => r.id !== sel.id))
      setFeedback('')
      refreshStats()
      setSelectedId((cur) => {
        const rest = queue.filter((r) => r.id !== sel.id)
        return cur === sel.id ? rest[0]?.id ?? null : cur
      })
      fire(
        verdict === 'approved'
          ? `${name} approved at OVR ${res.player?.overall ?? verifiedOvr}${creditLine(res.credited)} · released to scouting`
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
            <span className="evc-kicker">Platform Evaluator · No Club</span>
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
            <span className="evc-stat__v">{stats?.approved ?? '—'}</span>
            <span className="evc-stat__note">All time</span>
          </div>
          <div className="evc-stat evc-stat--pink">
            <span className="evc-stat__k">Rejected</span>
            <span className="evc-stat__v">{stats?.rejected ?? '—'}</span>
            <span className="evc-stat__note">All time</span>
          </div>
          <div className="evc-stat">
            <span className="evc-stat__k">Released</span>
            <span className="evc-stat__v">{stats?.released ?? '—'}</span>
            <span className="evc-stat__note">Players you cleared</span>
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

              <div className="evc-submeta">
                <span className="evc-submeta__cell">
                  <span className="evc-submeta__k">Submitted</span>
                  <span className="evc-submeta__v">{formatWhen(sel.submittedAt)}</span>
                </span>
                <span className="evc-submeta__cell">
                  <span className="evc-submeta__k">Session length</span>
                  <span className="evc-submeta__v">{sel.totalTime ? `${sel.totalTime} min` : '—'}</span>
                </span>
                <span className="evc-submeta__cell">
                  <span className="evc-submeta__k">Drills</span>
                  <span className="evc-submeta__v">{sel.drills.length}</span>
                </span>
                <span className="evc-submeta__cell">
                  <span className="evc-submeta__k">Waiting</span>
                  <span className="evc-submeta__v">{daysAgo(sel.submittedAt)}d</span>
                </span>
              </div>

              <div className="evc-block">
                <span className="evc-block__label">Training Proof</span>
                <ClipPlayer url={sel.videoUrl} />
              </div>

              <div className="evc-block">
                <span className="evc-block__label">
                  Drills Completed
                  <span className="evc-block__count evc-block__count--muted">
                    what the player logged
                  </span>
                </span>
                <div className="evc-drills">
                  {sel.drills.map((d, i) => (
                    <div key={`${d.name}-${i}`} className="evc-drill">
                      <span className="evc-drill__name">{d.name}</span>
                      <span className="evc-drill__vol">
                        {d.sets} × {d.reps} {d.unitKind === 'secs' ? 'secs' : 'reps'}
                      </span>
                      <span className="evc-drill__boosts">
                        {Object.entries(d.boosts || {}).map(([code, v]) => (
                          <span key={code} className="evc-boost">
                            +{v} {shortCode(code)}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                  {sel.drills.length === 0 && (
                    <p className="evc-drill__empty">No drills recorded on this submission.</p>
                  )}
                </div>
                <div className="evc-additions">
                  <span className="evc-additions__k">Attribute additions on approval</span>
                  <span className="evc-additions__v">
                    {Object.entries(sel.projectedRewards || {}).length === 0
                      ? 'None'
                      : Object.entries(sel.projectedRewards).map(([code, v]) => (
                          <span key={code} className="evc-boost evc-boost--lg">
                            +{v} {shortCode(code)}
                          </span>
                        ))}
                  </span>
                </div>
              </div>

              <div className="evc-block">
                <span className="evc-block__label">Player Notes</span>
                <p className="evc-notes">{sel.notes || 'The player left no notes.'}</p>
              </div>

              <div className="evc-block">
                <span className="evc-block__label">
                  Feedback
                  <span className="evc-block__count evc-block__count--muted">
                    sent with your verdict · optional
                  </span>
                </span>
                <textarea
                  className="evc-feedback"
                  rows={2}
                  placeholder="What the player should fix or keep doing…"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

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
