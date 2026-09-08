// Target-reviewer panel. The player never chooses: a club player's proof goes
// to their own head coach, and anyone without a club — a new player's baseline
// or a released free agent's session — is reviewed by the Platform Evaluator.
export function ReviewerRouting({ reviewer, reviewerRole, routingNote, tipOpen, tipOn, tipOff, tipToggle }) {
  return (
    <div className="sp-reviewer">
      <div className="sp-reviewer__top">
        <span className="sp-reviewer__eyebrow">Reviewer</span>
        <span className="sp-reviewer__lock is-locked">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <rect x="4" y="11" width="16" height="10" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Assigned automatically
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

      <div className="sp-reviewer__card">
        <span className="sp-reviewer__badge">{reviewer.badge}</span>
        <span className="sp-reviewer__who">
          <span className="sp-reviewer__name">{reviewer.name}</span>
          <span className="sp-reviewer__role">{reviewerRole}</span>
        </span>
      </div>

      {tipOpen && <span className="sp-reviewer__tip">{routingNote}</span>}
    </div>
  )
}
