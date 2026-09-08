import { useEffect, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { getReviewQueue, getReviewStats, reviewSubmission } from '../api/review'
import '../styles/coach-review.css'

// Coach Drill Proof Review Queue — live from GET /review/queue. For a club
// head coach that is their own squad's submissions; approving credits the
// drill's boost XP to the player's attributes.

function formatWhen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

// The submitted clip. File storage isn't wired up yet, so a URL that isn't a
// playable video is surfaced as a link instead of a dead <video>.
function ClipPlayer({ url }) {
  const playable = typeof url === 'string' && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
  if (!url) {
    return (
      <div className="crq-clip crq-clip--empty">
        <span className="crq-clip__title">No clip attached</span>
        <span className="crq-clip__note">This submission arrived without a video proof.</span>
      </div>
    )
  }
  if (!playable) {
    return (
      <div className="crq-clip crq-clip--empty">
        <span className="crq-clip__title">Clip stored as a link</span>
        <span className="crq-clip__note">File storage isn't wired up yet, so the proof is a URL:</span>
        <a className="crq-clip__url" href={url} target="_blank" rel="noreferrer noopener">{url}</a>
      </div>
    )
  }
  return <video className="crq-clip__video" src={url} controls preload="metadata" playsInline />
}

function initialsOf(name) {
  const p = (name || '').trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'
}
function minsAgo(iso) {
  return iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : 0
}
function agoLabel(mins) {
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

// Map a /review/queue item to the shape this page's UI expects.
const CODE_ABBR = {
  pace: 'PAC', shooting: 'SHO', passing: 'PAS', dribbling: 'DRI', defending: 'DEF', physical: 'PHY',
  diving: 'DIV', handling: 'HAN', kicking: 'KIC', reflexes: 'REF', speed: 'SPD', positioning: 'POS',
}
const abbr = (key) => CODE_ABBR[key] || key.slice(0, 3).toUpperCase()

function toSub(item) {
  const drill = item.drills?.[0] || {}
  const [code, val] = Object.entries(item.projectedRewards || {}).sort((a, b) => b[1] - a[1])[0] || []
  const shortCode = code ? abbr(code) : ''
  const mins = minsAgo(item.submittedAt)
  return {
    videoUrl: item.videoUrl,
    submittedAt: item.submittedAt,
    totalTime: item.totalTime,
    drills: item.drills || [],
    rewards: item.projectedRewards || {},
    totalXp: Object.values(item.projectedRewards || {}).reduce((a, b) => a + b, 0),
    id: item.id,
    player: item.player.name,
    initials: initialsOf(item.player.name),
    position: item.player.position,
    drill: drill.name || 'Training drill',
    time: agoLabel(mins),
    mins,
    xp: code ? `+${val} ${shortCode}` : '—',
    target: code ? `+${val} ${code[0].toUpperCase() + code.slice(1)}` : '—',
    volume: drill.sets ? `${drill.sets} Sets × ${drill.reps} ${drill.unitKind === 'secs' ? 'Secs' : 'Reps'}` : '—',
    ovr: item.player.overall,
    height: item.player.heightCm,
    weight: item.player.weightKg,
    baseline: 'Baseline session',
    notes: item.notes || 'No player notes.',
  }
}

export function CoachReviewQueuePage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [toast, setToast] = useState(null)
  const [stats, setStats] = useState(null) // lifetime review totals from GET /review/stats
  const [busy, setBusy] = useState(false)

  function refreshStats() {
    getReviewStats()
      .then(setStats)
      .catch(() => {})
  }

  function load() {
    setLoading(true)
    getReviewQueue()
      .then((rows) => {
        const subs = rows.map(toSub)
        setQueue(subs)
        setLoadError('')
        setSelected((cur) => (subs.some((s) => s.id === cur) ? cur : subs[0]?.id ?? null))
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load the review queue.'))
      .finally(() => setLoading(false))
    refreshStats()
  }

  useEffect(load, [])

  const open = queue
  const selectedId = selected === null ? open[0]?.id ?? null : selected
  const active = open.find((x) => x.id === selectedId) || null

  const approvedCount = stats?.approved ?? null
  const rejectedCount = stats?.rejected ?? null
  const creditedXp = stats?.xpCredited ?? 0

  function selectSub(id) {
    setSelected(id)
    setFeedback('')
  }

  async function resolve(verdict) {
    const cur = open.find((x) => x.id === selectedId) || open[0]
    if (!cur || busy) return
    setBusy(true)
    try {
      await reviewSubmission(cur.id, { verdict, feedback: feedback || undefined })
      setQueue((rows) => rows.filter((x) => x.id !== cur.id))
      refreshStats()
      const rest = open.filter((x) => x.id !== cur.id)
      setSelected(rest[0]?.id ?? null)
      setFeedback('')
      setToast({ verdict, player: cur.player, xp: cur.xp, drill: cur.drill })
    } catch (err) {
      setToast({ verdict: 'rejected', player: cur.player, xp: '', drill: err.response?.data?.message || 'Verdict failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <section className="crq-section">
        <div className="crq-head">
          <div className="crq-head__copy">
            <span className="crq-kicker">Coach Workspace</span>
            <h1 className="crq-title">Drill Proof Review Queue</h1>
            <p className="crq-lead">
              Watch the submitted clip, check the drills the player logged, and credit the attribute
              additions they earned.
            </p>
          </div>
          <div className="crq-head__role">
            <span className="crq-rolepill is-club">
              <span className="crq-rolepill__dot" />
              <span>Reviewing as: Your Club (Squad Coach)</span>
            </span>
            <p className="crq-scopenote">
              Your queue holds submissions routed to you — your own squad plus any player who named
              you as their reviewer. Approving credits the drill's boost XP.
            </p>
          </div>
        </div>

        <div className="crq-stats">
          <div className="crq-stat crq-stat--amber">
            <span className="crq-stat__k">Pending Reviews</span>
            <span className="crq-stat__v">
              {open.length}
              <span className="crq-stat__v-sub"> Waiting</span>
            </span>
            <span className="crq-stat__note">
              Oldest waiting {open.length ? open[open.length - 1].time : '—'}
            </span>
          </div>
          <div className="crq-stat crq-stat--green">
            <span className="crq-stat__k">Approved</span>
            <span className="crq-stat__v">{approvedCount ?? '—'}</span>
            <span className="crq-stat__note">All time · credited to attributes</span>
          </div>
          <div className="crq-stat crq-stat--indigo">
            <span className="crq-stat__k">XP Credited</span>
            <span className="crq-stat__v">+{creditedXp} XP</span>
            <span className="crq-stat__note">Across players you reviewed</span>
          </div>
          <div className="crq-stat">
            <span className="crq-stat__k">Rejected</span>
            <span className="crq-stat__v">{rejectedCount ?? '—'}</span>
            <span className="crq-stat__note">Broken takes or unclear framing</span>
          </div>
        </div>
      </section>

      <section className="crq-body">
        <div className="crq-queue">
          <div className="crq-queue__head">
            <h2 className="crq-queue__title">
              Squad Submissions
            </h2>
            <span className="crq-queue__hint">Oldest first</span>
          </div>

          {open.map((q) => {
            const overdue = q.mins >= 120
            return (
              <button
                key={q.id}
                type="button"
                className={`crq-qcard ${selectedId === q.id ? 'is-selected' : ''}`}
                onClick={() => selectSub(q.id)}
              >
                <div className="crq-qcard__top">
                  <span className="crq-avatar crq-avatar--sm">{q.initials}</span>
                  <span className="crq-qcard__id">
                    <span className="crq-qcard__player">{q.player}</span>
                    <span className="crq-qcard__pos">{q.position}</span>
                  </span>
                  <span className={`crq-qcard__time ${overdue ? 'is-overdue' : ''}`}>{q.time}</span>
                </div>
                <div className="crq-qcard__meta">
                  <span className="crq-qcard__drill">{q.drill}</span>
                  <span className="crq-qcard__xp">{q.xp}</span>
                  <span className={`crq-qcard__state ${overdue ? 'is-overdue' : ''}`}>
                    {overdue ? 'Overdue' : 'Awaiting review'}
                  </span>
                </div>
              </button>
            )
          })}

          {open.length === 0 && (
            <div className="crq-queue-empty">
              <span className="crq-queue-empty__title">Queue clear</span>
              <span className="crq-queue-empty__note">
                Every submission has been reviewed. New proofs appear here the moment players submit.
              </span>
            </div>
          )}
        </div>

        <div className="crq-reviewer">
          {active ? (
            <>
              <div className="crq-reviewer__head">
                <span className="crq-reviewer__eyebrow">Submission Reviewer</span>
                <span className="crq-reviewer__sub">
                  {active.drill} · submitted {active.time}
                </span>
              </div>

              <ClipPlayer url={active.videoUrl} />

              <div className="crq-player">
                <span className="crq-avatar crq-avatar--lg">{active.initials}</span>
                <span className="crq-player__id">
                  <span className="crq-player__name">{active.player}</span>
                  <span className="crq-player__meta">
                    {active.position} · {active.height} cm · {active.weight} kg
                  </span>
                </span>
                <span className="crq-player__ovr">
                  <span className="crq-player__ovr-v">{active.ovr}</span>
                  <span className="crq-player__ovr-l">OVR</span>
                </span>
              </div>

              <div className="crq-cells">
                <span className="crq-cell">
                  <span className="crq-cell__k">Submitted</span>
                  <span className="crq-cell__v">{formatWhen(active.submittedAt)}</span>
                </span>
                <span className="crq-cell">
                  <span className="crq-cell__k">Session Length</span>
                  <span className="crq-cell__v">{active.totalTime ? `${active.totalTime} min` : '—'}</span>
                </span>
                <span className="crq-cell">
                  <span className="crq-cell__k">Attribute Additions</span>
                  <span className="crq-cell__v is-amber">
                    {Object.entries(active.rewards).length
                      ? Object.entries(active.rewards).map(([c, v]) => `+${v} ${abbr(c)}`).join(' · ')
                      : 'None'}
                  </span>
                </span>
              </div>

              <div className="crq-field">
                <span className="crq-field__label">Drills Completed</span>
                <div className="crq-drills">
                  {active.drills.map((d, i) => (
                    <div key={`${d.name}-${i}`} className="crq-drill">
                      <span className="crq-drill__name">{d.name}</span>
                      <span className="crq-drill__vol">
                        {d.sets} × {d.reps} {d.unitKind === 'secs' ? 'secs' : 'reps'}
                      </span>
                      <span className="crq-drill__boosts">
                        {Object.entries(d.boosts || {}).map(([c, v]) => (
                          <span key={c} className="crq-boost">+{v} {abbr(c)}</span>
                        ))}
                      </span>
                    </div>
                  ))}
                  {active.drills.length === 0 && (
                    <p className="crq-drill__empty">No drills recorded on this submission.</p>
                  )}
                </div>
              </div>

              <div className="crq-field">
                <span className="crq-field__label">Player Notes</span>
                <p className="crq-notes">{active.notes}</p>
              </div>

              <div className="crq-field">
                <span className="crq-field__label">
                  Review Feedback <span className="crq-field__opt">· optional</span>
                </span>
                <textarea
                  className="crq-textarea"
                  rows={3}
                  placeholder="Coaching note back to the player…"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="crq-actions">
                <button type="button" className="crq-reject" onClick={() => resolve('rejected')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  Reject Submission
                </button>
                <button type="button" className="crq-approve" onClick={() => resolve('approved')}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                  Approve &amp; Credit {active.xp} XP
                </button>
              </div>
            </>
          ) : (
            <div className="crq-noactive">
              <span className="crq-noactive__title">No submission selected</span>
              <span className="crq-noactive__note">
                Pick a submission from the queue to watch the take, inspect the executed sets and
                award attribute XP.
              </span>
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className={`crq-toast is-${toast.verdict}`}>
          <span className="crq-toast__icon">
            {toast.verdict === 'approved' ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M4 12l5 5L20 6" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            )}
          </span>
          <span className="crq-toast__text">
            <span className="crq-toast__title">
              {toast.verdict === 'approved' ? 'XP credited' : 'Submission rejected'}
            </span>
            <span className="crq-toast__body">
              {toast.verdict === 'approved'
                ? `${toast.xp} awarded to ${toast.player} for ${toast.drill}. The player has been notified.`
                : `${toast.player}'s ${toast.drill} take was rejected. Your feedback was sent with the verdict.`}
            </span>
          </span>
          <button
            type="button"
            className="crq-toast__close"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </PageShell>
  )
}
