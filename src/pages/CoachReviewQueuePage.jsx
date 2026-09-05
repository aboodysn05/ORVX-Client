import { useEffect, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import '../styles/coach-review.css'

// Coach Drill Proof Review Queue — translated from the design canvas
// (OVRX Coach Review Queue.dc.html). Frontend only: works on the mock
// submissions below with local state (selection, verdicts, playback timer,
// toast). A role toggle previews both the club-coach and platform-evaluator
// queues.

const SUBS = [
  { id: 1, scope: 'free', player: 'J. Adeyemi', initials: 'JA', position: 'Attacker', drill: 'Cone Slalom Agility Weave', time: '12m ago', mins: 12, xp: '+2 PAC', target: '+2 Pace', volume: '3 Sets × 15 Reps', ovr: 79, height: 178, weight: 72, baseline: 'Baseline 2 of 3', notes: 'Wet grass on the far cone, slipped once on set two but kept the take unbroken.' },
  { id: 2, scope: 'free', player: 'L. Moreau', initials: 'LM', position: 'Defender', drill: 'Shadow Marking Steps', time: '34m ago', mins: 34, xp: '+2 DEF', target: '+2 Defending', volume: '4 Sets × 12 Reps', ovr: 79, height: 185, weight: 80, baseline: 'Baseline 1 of 3', notes: 'Filmed at the training cage, partner acting as attacker for each rep.' },
  { id: 3, scope: 'free', player: 'K. Ibarra', initials: 'KI', position: 'Goalkeeper', drill: 'Reaction Save Wall', time: '1h ago', mins: 60, xp: '+2 REF', target: '+2 Reflexes', volume: '3 Sets × 20 Secs', ovr: 81, height: 190, weight: 84, baseline: 'Baseline 3 of 3', notes: 'Rebound wall at three metres. Last set is the fastest sequence.' },
  { id: 4, scope: 'free', player: 'T. Okonkwo', initials: 'TO', position: 'Attacker', drill: 'Tight-Space 1v1 Dribbling', time: '2h ago', mins: 120, xp: '+2 DRI', target: '+2 Dribbling', volume: '3 Sets × 20 Secs', ovr: 76, height: 174, weight: 68, baseline: 'Baseline 1 of 3', notes: 'Used a 3x3 metre box marked with tape. Camera on a tripod at knee height.' },
  { id: 5, scope: 'squad', player: 'R. Vasquez', initials: 'RV', position: 'Defender', drill: 'Box-to-Box Sprint Drills', time: '26m ago', mins: 26, xp: '+1 PHY', target: '+1 Physical', volume: '4 Sets × 15 Secs', ovr: 82, height: 181, weight: 77, baseline: 'Squad · Matchweek 6', notes: 'Full pitch length, timed by a teammate. Slight wind against on the return runs.' },
  { id: 6, scope: 'squad', player: 'S. Haruna', initials: 'SH', position: 'Attacker', drill: 'First-Touch Wall Rebounds', time: '1h ago', mins: 60, xp: '+2 PAS', target: '+2 Passing', volume: '3 Sets × 18 Reps', ovr: 78, height: 176, weight: 70, baseline: 'Squad · Matchweek 6', notes: 'Concrete wall, both feet alternating. Ball out of frame once on set three.' },
  { id: 7, scope: 'squad', player: 'D. Ferreira', initials: 'DF', position: 'Goalkeeper', drill: 'Low Dive Recovery', time: '3h ago', mins: 180, xp: '+2 DIV', target: '+2 Diving', volume: '3 Sets × 14 Reps', ovr: 80, height: 188, weight: 82, baseline: 'Squad · Matchweek 6', notes: 'Both sides worked. Left-side dives feel slower on the second set.' },
  { id: 8, scope: 'squad', player: 'A. Lindqvist', initials: 'AL', position: 'Attacker', drill: 'Close-Range Finishing', time: '5h ago', mins: 300, xp: '+2 SHO', target: '+2 Shooting', volume: '4 Sets × 10 Reps', ovr: 83, height: 179, weight: 74, baseline: 'Squad · Matchweek 6', notes: 'Six-yard finishing off a served ball, alternating feet each rep.' },
]

function clock(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

export function CoachReviewQueuePage() {
  const [role, setRole] = useState('club') // 'club' | 'platform'
  const [selected, setSelected] = useState(null)
  const [resolved, setResolved] = useState({})
  const [feedback, setFeedback] = useState('')
  const [playing, setPlaying] = useState(false)
  const [playSec, setPlaySec] = useState(74)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!playing) return undefined
    const id = setInterval(() => {
      setPlaySec((s) => {
        if (s >= 90) {
          setPlaying(false)
          return 90
        }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [playing])

  const platform = role === 'platform'
  const scope = platform ? 'free' : 'squad'
  const mine = SUBS.filter((x) => x.scope === scope)
  const open = mine.filter((x) => !resolved[x.id])
  const selectedId = selected === null ? open[0]?.id ?? null : selected
  const active = open.find((x) => x.id === selectedId) || null

  const approvedCount = Object.values(resolved).filter((v) => v === 'approved').length
  const rejectedCount = Object.values(resolved).filter((v) => v === 'rejected').length
  const creditedXp = Object.keys(resolved).reduce((n, k) => {
    if (resolved[k] !== 'approved') return n
    const s = SUBS.find((x) => String(x.id) === String(k))
    return n + (s ? parseInt(s.xp.replace(/[^0-9]/g, ''), 10) || 0 : 0)
  }, 0)

  function selectSub(id) {
    setSelected(id)
    setFeedback('')
    setPlaySec(74)
    setPlaying(false)
  }

  function resolve(verdict) {
    const cur = open.find((x) => x.id === selectedId) || open[0]
    if (!cur) return
    const nextResolved = { ...resolved, [cur.id]: verdict }
    const nextOpen = mine.filter((x) => !nextResolved[x.id])
    setResolved(nextResolved)
    setSelected(nextOpen[0]?.id ?? null)
    setFeedback('')
    setPlaySec(74)
    setPlaying(false)
    setToast({ verdict, player: cur.player, xp: cur.xp, drill: cur.drill })
  }

  return (
    <PageShell>
      <section className="crq-section">
        <div className="crq-head">
          <div className="crq-head__copy">
            <span className="crq-kicker">Coach Workspace</span>
            <h1 className="crq-title">Drill Proof Review Queue</h1>
            <p className="crq-lead">
              Review unbroken 90-second video submissions, inspect sets/reps, and award verified
              attribute XP.
            </p>
          </div>
          <div className="crq-head__role">
            <span className={`crq-rolepill is-${platform ? 'platform' : 'club'}`}>
              <span className="crq-rolepill__dot" />
              <span>
                Reviewing as: {platform ? 'Coach #9 (Platform Evaluator)' : 'Your Club (Squad Coach)'}
              </span>
            </span>
            <p className="crq-scopenote">
              {platform
                ? 'Your queue holds unassigned players only — their first 3 baseline sessions before any club can sign them.'
                : 'Your queue holds your own squad players only. Free agents are handled by the Platform Evaluator.'}
            </p>
            <div className="crq-roletoggle">
              {[
                { key: 'club', label: 'Squad Queue' },
                { key: 'platform', label: 'Evaluator Queue' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`crq-roletoggle__btn ${role === r.key ? 'is-active' : ''}`}
                  onClick={() => {
                    setRole(r.key)
                    setSelected(null)
                    setResolved({})
                    setFeedback('')
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
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
            <span className="crq-stat__k">Approved Today</span>
            <span className="crq-stat__v">{14 + approvedCount}</span>
            <span className="crq-stat__note">Avg turnaround 18h</span>
          </div>
          <div className="crq-stat crq-stat--indigo">
            <span className="crq-stat__k">Total XP Credited</span>
            <span className="crq-stat__v">+{42 + creditedXp} XP</span>
            <span className="crq-stat__note">Across all reviewed players</span>
          </div>
          <div className="crq-stat">
            <span className="crq-stat__k">Rejected Today</span>
            <span className="crq-stat__v">{2 + rejectedCount}</span>
            <span className="crq-stat__note">Broken takes or unclear framing</span>
          </div>
        </div>
      </section>

      <section className="crq-body">
        <div className="crq-queue">
          <div className="crq-queue__head">
            <h2 className="crq-queue__title">
              {platform ? 'New Player Baselines' : 'Squad Submissions'}
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

              <div className="crq-video">
                <span className="crq-video__frame" />
                <span className="crq-video__corner crq-video__corner--tl" />
                <span className="crq-video__corner crq-video__corner--tr" />
                <span className="crq-video__corner crq-video__corner--bl" />
                <span className="crq-video__corner crq-video__corner--br" />
                <button
                  type="button"
                  className="crq-video__play"
                  aria-label="Play submission"
                  onClick={() => setPlaying((p) => !p)}
                >
                  {playing ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF2E63">
                      <rect x="6" y="5" width="4" height="14" />
                      <rect x="14" y="5" width="4" height="14" />
                    </svg>
                  ) : (
                    <svg width="27" height="27" viewBox="0 0 24 24" fill="#FF2E63">
                      <path d="M8 5l12 7-12 7z" />
                    </svg>
                  )}
                </button>
                <span className="crq-video__badge">Unbroken take</span>
                <div className="crq-video__controls">
                  <span className="crq-video__track">
                    <span
                      className="crq-video__fill"
                      style={{ width: `${Math.round((playSec / 90) * 100)}%` }}
                    />
                  </span>
                  <div className="crq-video__ctlrow">
                    <button
                      type="button"
                      className="crq-video__ctl"
                      aria-label="Toggle playback"
                      onClick={() => setPlaying((p) => !p)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5l12 7-12 7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="crq-video__ctl"
                      aria-label="Restart"
                      onClick={() => {
                        setPlaySec(0)
                        setPlaying(true)
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M20 12a8 8 0 1 1-2.3-5.6" />
                        <path d="M20 4v4h-4" />
                      </svg>
                    </button>
                    <span className="crq-video__clock">{clock(playSec)} / 01:30</span>
                  </div>
                </div>
              </div>

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
                  <span className="crq-cell__k">Executed Volume</span>
                  <span className="crq-cell__v">{active.volume}</span>
                </span>
                <span className="crq-cell">
                  <span className="crq-cell__k">Target Attribute</span>
                  <span className="crq-cell__v is-amber">{active.target}</span>
                </span>
                <span className="crq-cell">
                  <span className="crq-cell__k">{platform ? 'Baseline Session' : 'Squad Context'}</span>
                  <span className="crq-cell__v">{active.baseline}</span>
                </span>
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
