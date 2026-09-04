import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useActiveWorkout } from '../hooks/useActiveWorkout'
import { PlayerNav } from '../components/layout/PlayerNav'
import '../styles/workout.css'

function DrillCard({ drill }) {
  return (
    <div className={`aw-drill is-${drill.state}`}>
      <div className="aw-drill__head">
        <span className="aw-drill__num">{drill.n}</span>
        <span className="aw-drill__id">
          <span className="aw-drill__name">{drill.name}</span>
          <span className="aw-drill__boost">{drill.boost}</span>
        </span>
        <span className="aw-drill__status">{drill.statusLabel}</span>
      </div>

      <div className="aw-drill__sets">
        {drill.sets.map((set) => (
          <button key={set.key} type="button" className={`aw-set is-${set.state}`} onClick={set.toggle}>
            <span className="aw-set__box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </span>
            <span className="aw-set__label">{set.label}</span>
            <span className="aw-set__state">{set.stateLabel}</span>
          </button>
        ))}
      </div>

      {drill.showGuidance && (
        <div className="aw-drill__guidance">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF2E63" strokeWidth="2">
            <path d="M15 10l6-3v10l-6-3z" />
            <rect x="3" y="7" width="12" height="10" />
          </svg>
          <span>Record your unbroken take during this drill for video proof!</span>
        </div>
      )}
    </div>
  )
}

// Shown once every set is ticked: the workout is locked and can't be
// re-entered — the player either submits proof or discards and rebuilds.
function CompletedCard({ aw, navigate }) {
  return (
    <div className="aw">
      <div className="aw__grid" />
      <div className="aw__glow-a" />
      <div className="aw__glow-b" />

      <PlayerNav />

      <section className="aw-done">
        <span className="aw-done__check">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22E07E" strokeWidth="2.6">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </span>
        <span className="aw-done__eyebrow">Session Complete</span>
        <h1 className="aw-done__title">{aw.sessionTitle}</h1>
        <p className="aw-done__note">
          All {aw.drillTotal} drills logged · finished {aw.completedAgo}. This session is locked —
          submit your video proof to send it for review.
        </p>

        <div className="aw-done__rewards">
          {aw.rewards.map((reward) => (
            <span key={reward} className="aw-reward">
              {reward}
            </span>
          ))}
        </div>

        <div className="aw-done__actions">
          <button
            type="button"
            className="aw-done__submit"
            onClick={() => navigate('/submit-proof')}
          >
            Submit Video Proof
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M4 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            className="aw-done__discard"
            onClick={() => {
              aw.discard()
              navigate('/train')
            }}
          >
            Discard &amp; build new
          </button>
        </div>
      </section>
    </div>
  )
}

// Active Workout HUD — the live view for a running training session. Stopwatch,
// completion progress, and a checklist where every set is a toggle button.
export function WorkoutPage() {
  const navigate = useNavigate()
  const aw = useActiveWorkout()

  // No session in flight — nothing to run.
  if (aw.missing) {
    return <Navigate to="/train" replace />
  }

  // Finished and locked.
  if (aw.locked) {
    return <CompletedCard aw={aw} navigate={navigate} />
  }

  function finishWorkout() {
    aw.finish()
    navigate('/submit-proof')
  }

  return (
    <div className="aw">
      <div className="aw__grid" />
      <div className="aw__glow-a" />
      <div className="aw__glow-b" />

      <PlayerNav />

      <section className="aw-head">
        <div className="aw-head__top">
          <div className="aw-head__titles">
            <span className="aw-head__crumbs">
              <Link to="/dashboard">Dashboard</Link>
              <span className="aw-head__crumb-sep">/</span>
              <Link to="/train">Session Builder</Link>
              <span className="aw-head__crumb-sep">/</span>
              <span className="aw-head__crumb-here">Active Workout</span>
            </span>
            <h1 className="aw-head__title">Active Workout HUD</h1>
            <span className="aw-head__session">{aw.sessionTitle}</span>
          </div>
          <span className="aw-head__live">
            <span className="aw-head__live-dot" />
            Session Live
          </span>
        </div>

        <div className="aw-stats">
          <div className="aw-stat">
            <span className="aw-stat__label">Elapsed Pitch Time</span>
            <span className="aw-stat__clock">{aw.elapsed}</span>
            <span className="aw-stat__note">Pitch stopwatch running</span>
          </div>

          <div className="aw-stat">
            <span className="aw-stat__label">Overall Completion</span>
            <span className="aw-stat__count">
              {aw.drillsDone} / {aw.drillTotal}
              <span className="aw-stat__count-sub"> Drills Complete</span>
            </span>
            <span className="aw-progress">
              <span
                className={`aw-progress__fill ${aw.allDone ? 'is-done' : ''}`}
                style={{ width: aw.progressPct }}
              />
            </span>
            <span className={`aw-stat__pct ${aw.allDone ? 'is-done' : ''}`}>{aw.progressLabel}</span>
          </div>

          <div className="aw-stat aw-stat--xp">
            <span className="aw-stat__label aw-stat__label--xp">Target XP Rewards</span>
            <div className="aw-stat__rewards">
              {aw.rewards.map((reward) => (
                <span key={reward} className="aw-reward">
                  {reward}
                </span>
              ))}
            </div>
            <span className="aw-stat__note">Awarded on coach approval</span>
          </div>
        </div>
      </section>

      <section className="aw-main">
        <div className="aw-list-head">
          <h2 className="aw-list-head__title">Drill To-Do List</h2>
          <span className="aw-list-head__hint">Tick each set as you finish it</span>
        </div>

        {aw.drills.map((drill) => (
          <DrillCard key={drill.key} drill={drill} />
        ))}
      </section>

      <div className="aw-bar">
        <div className="aw-bar__stats">
          <span className="aw-bar__stat">
            <span className="aw-bar__stat-label">Drills Completed</span>
            <span className={`aw-bar__stat-value ${aw.allDone ? 'is-done' : ''}`}>
              {aw.drillsDone} / {aw.drillTotal}
            </span>
          </span>
          <span className="aw-bar__stat aw-bar__stat--divide">
            <span className="aw-bar__stat-label">Sets Ticked</span>
            <span className="aw-bar__stat-value aw-bar__stat-value--muted">
              {aw.setsDone} / {aw.setsTotal}
            </span>
          </span>
        </div>

        <div className="aw-bar__actions">
          <button
            type="button"
            className="aw-bar__cancel"
            onClick={() => {
              aw.cancel()
              navigate('/train')
            }}
          >
            Cancel Workout
          </button>
          {aw.allDone ? (
            <button type="button" className="aw-bar__finish" onClick={finishWorkout}>
              Finish Workout &amp; Submit Video Proof
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                <path d="M4 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          ) : (
            <button type="button" className="aw-bar__finish aw-bar__finish--locked" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="11" width="16" height="10" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              {aw.finishLockedLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
