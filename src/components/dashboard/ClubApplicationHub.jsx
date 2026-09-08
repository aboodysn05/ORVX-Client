import { useEffect } from 'react'

function PaperPlaneIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20l19-8L3 4v5l13 3-13 3z" />
    </svg>
  )
}

// One club in the hub. A club is only selectable when it has a head coach to
// receive the application, has a squad place free, and the player isn't
// already waiting on another club.
function ClubCard({ club, selected, onSelect }) {
  let state = 'open'
  let note = `${club.places} place${club.places === 1 ? '' : 's'} open`
  if (club.applied) {
    state = 'applied'
    note = 'Your application is with this coach'
  } else if (!club.coach) {
    state = 'nocoach'
    note = 'No head coach yet — cannot receive applications'
  } else if (club.full) {
    state = 'full'
    note = 'Squad is full'
  } else if (!club.selectable) {
    state = 'blocked'
    note = 'Withdraw your current application first'
  }

  return (
    <button
      type="button"
      className={`hub-club is-${state} ${selected ? 'is-selected' : ''}`}
      disabled={!club.selectable && !club.applied}
      onClick={() => club.selectable && onSelect(club.id)}
    >
      <span className="hub-club__head">
        <span className="hub-club__crest">{club.crest}</span>
        <span className="hub-club__id">
          <span className="hub-club__name">{club.name}</span>
          <span className="hub-club__coach">{club.coach || 'Unassigned'}</span>
        </span>
        {club.applied && <span className="hub-club__badge">Applied</span>}
      </span>
      <span className="hub-club__stats">
        <span className="hub-club__stat">
          <span className="hub-club__stat-label">Squad</span>
          <span className="hub-club__stat-value">{club.squad}</span>
        </span>
        <span className="hub-club__stat">
          <span className="hub-club__stat-label">League</span>
          <span className="hub-club__stat-value">{club.rank}</span>
        </span>
      </span>
      <span className={`hub-club__note is-${state}`}>{note}</span>
    </button>
  )
}

// The club-application hub. `onConfirm` posts a real application
// (POST /clubs/:id/applications); `onWithdraw` cancels the pending one. A
// player holds at most one open application at a time.
export function ClubApplicationHub({
  open,
  clubs,
  selectedClub,
  chosen,
  onSelectClub,
  onConfirm,
  onWithdraw,
  onClose,
  sentOpen,
  onCloseSent,
  onBackToHub,
  player,
  pendingApplication,
  error,
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

  const openCount = clubs.filter((c) => c.open).length

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
                  <h2 className="hub__title">Apply to an Official Club</h2>
                  <p className="hub__lead">
                    {pendingApplication
                      ? `Your profile is with ${pendingApplication.clubName}. You can hold one application at a time — withdraw it to apply somewhere else.`
                      : `${openCount} of ${clubs.length} clubs can take an application right now. Pick one to send your verified profile to its head coach.`}
                  </p>
                </div>
                <button type="button" className="hub__close" aria-label="Close" onClick={onClose}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="hub__clubs">
                {clubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    selected={selectedClub === club.id}
                    onSelect={onSelectClub}
                  />
                ))}
              </div>
            </div>

            <div className="hub__drawer">
              <span className="hub__drawer-eyebrow">
                {pendingApplication ? 'Application In Progress' : 'Send Your Profile'}
              </span>

              {pendingApplication ? (
                <div className="hub__review">
                  <div className="hub__chosen">
                    <span className="hub__chosen-crest">
                      {clubs.find((c) => c.id === pendingApplication.clubId)?.crest || '—'}
                    </span>
                    <span className="hub__chosen-id">
                      <span className="hub__chosen-name">{pendingApplication.clubName}</span>
                      <span className="hub__chosen-meta">Awaiting the head coach&apos;s decision</span>
                    </span>
                  </div>
                  <p className="hub__note">
                    The coach can see your verified attributes, physicals and approved session. If
                    they accept, you join their squad; if they decline, you&apos;re free to apply
                    elsewhere.
                  </p>
                  {error && <p className="hub__error">{error}</p>}
                  <button
                    type="button"
                    className="hub__withdraw"
                    onClick={() => onWithdraw(pendingApplication.id)}
                  >
                    Withdraw Application
                  </button>
                </div>
              ) : !chosen ? (
                <div className="hub__empty">
                  <span className="hub__empty-title">No club selected</span>
                  <span className="hub__empty-note">
                    Pick a club on the left to review your application before it reaches the head
                    coach.
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
                      <span className="hub__profile-verified">Verified baseline session</span>
                      <span className="hub__profile-line">
                        {player.height} cm · {player.weight} kg · {player.topAttrs}
                      </span>
                    </span>
                  </div>

                  {error && <p className="hub__error">{error}</p>}

                  <button type="button" className="hub__confirm" onClick={onConfirm}>
                    <PaperPlaneIcon />
                    Send Profile to {chosen.coach}
                  </button>
                  <span className="hub__note">
                    One open application at a time. You can withdraw it from here or your dashboard
                    at any point before the coach decides.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {sentOpen && chosen && (
        <div className="sent" role="dialog" aria-modal="true" onClick={onCloseSent}>
          <div className="sent__panel" onClick={(event) => event.stopPropagation()}>
            <span className="sent__icon">
              <PaperPlaneIcon size={24} />
            </span>
            <span className="sent__title">Profile sent to {chosen.name}</span>
            <p className="sent__body">
              {chosen.coach} now has your verified profile as {player.positionLabel}. Your
              application stays open until they accept or decline it — you can withdraw it from your
              dashboard.
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
