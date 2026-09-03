import { useEffect } from 'react'

function PaperPlaneIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20l19-8L3 4v5l13 3-13 3z" />
    </svg>
  )
}

function ClubCard({ club, index, selected, onSelect }) {
  const isSelected = selected === index
  let ctaLabel
  if (isSelected) ctaLabel = club.full ? 'Selected — Waitlist Request' : 'Selected — See Drawer'
  else ctaLabel = club.full ? 'Squad Full — Join Waitlist' : 'Submit Profile to Coach'

  return (
    <div className={`hub-club ${isSelected ? 'is-selected' : ''}`}>
      <div className="hub-club__head">
        <span className="hub-club__crest">{club.crest}</span>
        <span className="hub-club__id">
          <span className="hub-club__name">{club.name}</span>
          <span className="hub-club__coach">{club.coach}</span>
        </span>
      </div>
      <div className="hub-club__stats">
        <span className="hub-club__stat">
          <span className="hub-club__stat-label">Squad</span>
          <span className="hub-club__stat-value">{club.squad}</span>
        </span>
        <span className="hub-club__stat">
          <span className="hub-club__stat-label">League</span>
          <span className={`hub-club__stat-value ${club.hot ? 'is-hot' : ''}`}>{club.rank}</span>
        </span>
      </div>
      <button
        type="button"
        className={`hub-club__cta ${isSelected ? 'is-selected' : ''} ${club.full ? 'is-full' : ''}`}
        onClick={() => onSelect(index)}
      >
        {ctaLabel}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}

// The club-application hub modal and its success confirmation. Both are
// front-end-only flows — nothing is sent anywhere yet.
export function ClubApplicationHub({
  open,
  clubs,
  selectedClub,
  chosen,
  onSelectClub,
  onConfirm,
  onClose,
  sentOpen,
  onCloseSent,
  onBackToHub,
  player,
}) {
  useEffect(() => {
    if (!open && !sentOpen) return undefined
    function onKey(event) {
      if (event.key !== 'Escape') return
      if (sentOpen) onCloseSent()
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, sentOpen, onClose, onCloseSent])

  const chosenIsFull = Boolean(chosen?.full)

  return (
    <>
      {open && (
        <div className="hub" role="dialog" aria-modal="true" onClick={onClose}>
          <div className="hub__panel" onClick={(event) => event.stopPropagation()}>
            <div className="hub__main">
              <div className="hub__header">
                <div className="hub__intro">
                  <span className="hub__verified">
                    <span className="hub__verified-dot" />
                    Baseline Verified
                  </span>
                  <h2 className="hub__title">Select &amp; Apply to an Official Club</h2>
                  <p className="hub__lead">
                    You have verified your baseline training session! Select one of the 8 active
                    platform clubs to submit your player profile to its Head Coach.
                  </p>
                </div>
                <button type="button" className="hub__close" aria-label="Close" onClick={onClose}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="hub__clubs">
                {clubs.map((club, index) => (
                  <ClubCard
                    key={club.name}
                    club={club}
                    index={index}
                    selected={selectedClub}
                    onSelect={onSelectClub}
                  />
                ))}
              </div>
            </div>

            <div className="hub__drawer">
              <span className="hub__drawer-eyebrow">Submit Profile to Coach</span>

              {selectedClub === null ? (
                <div className="hub__empty">
                  <span className="hub__empty-title">No club selected</span>
                  <span className="hub__empty-note">
                    Pick a club on the left to review your application before it reaches the Head
                    Coach.
                  </span>
                </div>
              ) : (
                <div className="hub__review">
                  <div className="hub__chosen">
                    <span className="hub__chosen-crest">{chosen.crest}</span>
                    <span className="hub__chosen-id">
                      <span className="hub__chosen-name">{chosen.name}</span>
                      <span className="hub__chosen-meta">
                        {chosen.coach} · {chosen.squad}
                      </span>
                    </span>
                  </div>

                  <div className="hub__applying">
                    <span className="hub__applying-label">Applying as</span>
                    <span className="hub__applying-pos">
                      {player.positionLabel}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C89A2" strokeWidth="2.4">
                        <rect x="4" y="11" width="16" height="10" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                  </div>

                  <div className="hub__profile">
                    <span className="hub__profile-ovr">
                      <span className="hub__profile-ovr-value">{player.overall}</span>
                      <span className="hub__profile-ovr-label">OVR</span>
                    </span>
                    <span className="hub__profile-who">
                      <span className="hub__profile-name">{player.name}</span>
                      <span className="hub__profile-verified">Verified baseline · 1 session</span>
                      <span className="hub__profile-line">
                        {player.height} cm · {player.weight} kg · {player.topAttrs}
                      </span>
                    </span>
                  </div>

                  <button type="button" className="hub__confirm" onClick={onConfirm}>
                    <PaperPlaneIcon />
                    {chosenIsFull
                      ? 'Confirm & Send Waitlist Request'
                      : 'Confirm & Send Profile to Coach'}
                  </button>
                  <span className="hub__note">
                    {chosenIsFull
                      ? `${chosen.name} has a full 15-player squad. Your profile joins the waitlist and reaches ${chosen.coach} the moment a place opens.`
                      : 'One active application at a time. The Head Coach sees your verified attributes, physicals and your approved session clip.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {sentOpen && (
        <div className="sent" role="dialog" aria-modal="true" onClick={onCloseSent}>
          <div className="sent__panel" onClick={(event) => event.stopPropagation()}>
            <span className="sent__icon">
              <PaperPlaneIcon size={24} />
            </span>
            <span className="sent__title">
              {chosenIsFull ? `Waitlisted at ${chosen.name}` : `Profile sent to ${chosen.name}`}
            </span>
            <p className="sent__body">
              {chosenIsFull
                ? `${chosen.coach} will receive your verified profile as ${player.positionLabel} as soon as a squad place frees up. You stay on the waitlist until then.`
                : `${chosen.coach} now has your verified profile as ${player.positionLabel}. You will be notified when the club responds — your application stays active until then.`}
            </p>
            <div className="sent__actions">
              <button type="button" className="sent__btn sent__btn--primary" onClick={onCloseSent}>
                Done
              </button>
              <button type="button" className="sent__btn" onClick={onBackToHub}>
                Review Clubs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
