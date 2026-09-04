// Target-reviewer panel. Until the player's baseline session is approved the
// reviewer is locked to Platform Coach #9; once it clears, the field opens to
// the eight Club Head Coaches.
export function ReviewerRouting({
  baselineDone,
  lockLabel,
  coaches,
  coach,
  onSelectCoach,
  tipOpen,
  tipOn,
  tipOff,
  tipToggle,
}) {
  return (
    <div className="sp-reviewer">
      <div className="sp-reviewer__top">
        <span className="sp-reviewer__eyebrow">Target Reviewer</span>
        <span className={`sp-reviewer__lock ${baselineDone ? 'is-open' : 'is-locked'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <rect x="4" y="11" width="16" height="10" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {lockLabel}
        </span>
        <button
          type="button"
          className="sp-reviewer__info"
          aria-label="Reviewer routing info"
          onMouseEnter={tipOn}
          onMouseLeave={tipOff}
          onClick={tipToggle}
        >
          i
        </button>
      </div>

      {baselineDone ? (
        <div className="sp-reviewer__pick">
          <span className="sp-reviewer__pick-label">Choose a Club Head Coach</span>
          <select className="sp-reviewer__select" value={coach} onChange={onSelectCoach}>
            {coaches.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <span className="sp-reviewer__pick-hint">
            Your baseline is verified — submissions now go straight to a club coach.
          </span>
        </div>
      ) : (
        <div className="sp-reviewer__card">
          <span className="sp-reviewer__badge">#9</span>
          <span className="sp-reviewer__who">
            <span className="sp-reviewer__name">Coach #9</span>
            <span className="sp-reviewer__role">Official Platform Evaluator</span>
          </span>
        </div>
      )}

      {tipOpen && (
        <span className="sp-reviewer__tip">
          Your baseline session is evaluated by Platform Coach #9. Once it’s approved, this field
          opens up and you pick a Club Head Coach.
        </span>
      )}
    </div>
  )
}
