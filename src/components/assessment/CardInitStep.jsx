// Step 4 — read-only review of everything the wizard collected before the
// player locks the starting card in.
export function CardInitStep({ position, foot, physique, overall, tierName }) {
  const rows = [
    { label: 'Position', value: position },
    { label: 'Dominant Foot', value: foot },
    { label: 'Height & Weight', value: physique },
  ]

  return (
    <div className="asm-step asm-review">
      <div className="asm-review__banner">
        <span className="asm-review__flag">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <rect x="4" y="11" width="16" height="10" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Rating Reveal · Locking In
        </span>
        <span className="asm-review__hint">These values lock on confirm</span>
      </div>

      {rows.map((row) => (
        <div key={row.label} className="asm-review__row">
          <span className="asm-review__key">{row.label}</span>
          <span className="asm-review__value">{row.value}</span>
        </div>
      ))}

      <div className="asm-review__row">
        <span className="asm-review__key">Starting Overall</span>
        <span className="asm-review__value asm-review__value--accent">
          OVR {overall} · {tierName}
        </span>
      </div>

      <p className="asm-review__disclaimer">
        This is a starting card only. Your first coach-verified drill submission re-scores every
        attribute against measured data, so self-assessment never inflates a rating for long.
      </p>
    </div>
  )
}
