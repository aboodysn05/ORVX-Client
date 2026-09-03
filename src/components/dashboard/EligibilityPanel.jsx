function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="4" y="11" width="16" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

// Section 2, left column: the "Progression Gate" that unlocks club
// applications once three baseline sessions are approved.
export function EligibilityPanel({
  approved,
  totalSessions,
  remaining,
  meter,
  meterColor,
  milestones,
  locked,
  lockedLabel,
  onOpenHub,
  onSetApproved,
}) {
  return (
    <div className="dash-gate">
      <div className="dash-gate__head">
        <div className="dash-gate__title">
          <span className="dash-gate__eyebrow">Progression Gate</span>
          <h2 className="dash-gate__h2">Club Application Eligibility</h2>
        </div>
        <div className="dash-gate__count">
          <span className="dash-gate__count-label">Completed &amp; approved</span>
          <span className="dash-gate__count-value" style={{ color: meterColor }}>
            {approved}
            <span className="dash-gate__count-total"> / {totalSessions}</span>
          </span>
        </div>
      </div>

      <div className="dash-gate__meter">
        {meter.map((segment, i) => (
          <span
            key={i}
            className={`dash-gate__seg ${segment.done ? 'is-done' : ''} ${
              segment.next ? 'is-next' : ''
            }`}
          />
        ))}
      </div>

      <div className="dash-gate__milestones">
        {milestones.map((milestone) => (
          <div key={milestone.title} className={`dash-milestone is-${milestone.state}`}>
            <div className="dash-milestone__head">
              <span className="dash-milestone__title">{milestone.title}</span>
              <span className="dash-milestone__icon">{milestone.icon}</span>
            </div>
            <span className="dash-milestone__status">{milestone.status}</span>
            <span className="dash-milestone__detail">{milestone.detail}</span>
          </div>
        ))}
      </div>

      {locked ? (
        <div className="dash-gate__action">
          <button type="button" className="dash-gate__btn dash-gate__btn--locked" disabled>
            <LockIcon />
            {lockedLabel}
          </button>
          <span className="dash-gate__hint">
            Applications open automatically once your baseline session is approved.
          </span>
        </div>
      ) : (
        <div className="dash-gate__action">
          <button type="button" className="dash-gate__btn dash-gate__btn--unlocked" onClick={onOpenHub}>
            <BoltIcon />
            Apply to Official Clubs (Unlocked!)
          </button>
          <span className="dash-gate__hint dash-gate__hint--go">
            Verified baseline complete · 12 clubs are scouting your position
          </span>
        </div>
      )}

      <div className="dash-gate__preview">
        <span className="dash-gate__preview-label">Preview state</span>
        <div className="dash-gate__toggle">
          {Array.from({ length: totalSessions + 1 }, (_, n) => (
            <button
              key={n}
              type="button"
              className={`dash-gate__toggle-btn ${n === approved ? 'is-active' : ''}`}
              onClick={() => onSetApproved(n)}
            >
              {n} / {totalSessions}
            </button>
          ))}
        </div>
        <span className="dash-gate__remaining">
          {remaining > 0 ? `${remaining} to go` : 'Baseline complete'}
        </span>
      </div>
    </div>
  )
}
