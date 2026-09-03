// Live player card on the right of the assessment screen. Every value is
// derived state from usePlayerAssessment(); the tier colour drives the card
// accent through the `--tier` custom property, and each stat bar is sized from
// its own `--val`.
export function PlayerCardPreview({
  playerName,
  overall,
  tier,
  positionCode,
  footCode,
  physique,
  badges,
}) {
  return (
    <div className="asm-card-wrap">
      <div className="asm-card-wrap__glow" />

      <article className="asm-card" style={{ '--tier': tier.color }}>
        <header className="asm-card__top">
          <span className="asm-card__ovr-group">
            <span className="asm-card__ovr">{overall}</span>
            <span className="asm-card__ovr-label">Overall</span>
          </span>
          <span className="asm-card__meta">
            <span className="asm-card__tier">{tier.name} Tier</span>
            <span className="asm-card__pos">
              {positionCode} · {footCode}
            </span>
          </span>
        </header>

        <div className="asm-card__id">
          <span className="asm-card__name">{playerName}</span>
          <span className="asm-card__physique">{physique}</span>
          <span className="asm-card__status">Unverified · Self-assessed</span>
        </div>

        <div className="asm-card__grid">
          {badges.map((badge) => (
            <div key={badge.key} className="asm-card__stat">
              <div className="asm-card__stat-head">
                <span className="asm-card__stat-code">{badge.code}</span>
                <span className="asm-card__stat-value">{badge.value}</span>
              </div>
              <span className="asm-card__stat-bar" style={{ '--val': badge.value }} />
            </div>
          ))}
        </div>

        <footer className="asm-card__foot">
          <span className="asm-card__live">
            <span className="asm-card__live-dot" />
            Live Preview
          </span>
          <span className="asm-card__live-note">Updates as you answer</span>
        </footer>
      </article>
    </div>
  )
}
