import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { applyAsCoach } from '../api/coaches'
import { listClubs } from '../api/clubs'
import { useCoachApplication, refreshCoachApplication } from '../hooks/useCoachApplication'
import '../styles/coach-gateway.css'

// Coach onboarding: a coach-role user requests to open and manage one of the
// platform's 8 club slots. The request is POSTed to the backend (POST
// /coaches/applications) and an admin approves or declines it. The Platform
// Evaluator is a separate coach-role account with no club onboarding.

// The platform runs a fixed 8-club roster; every squad is capped at 16.
const CLUB_SLOTS = 8
const SQUAD_CAP = 16

const CLUB_UNLOCKS = [
  'Full management rights over your squad roster.',
  'Approve or reject player training submissions.',
  'Enter match results and league fixtures.',
  'Scout free agents who completed their baseline session.',
]

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 17V7" />
      <path d="M8 11l4-4 4 4" />
      <path d="M4 19h16" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <rect x="4" y="11" width="16" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function HomeArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

function BrandMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" />
      <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" opacity="0.5" />
      <path d="M39 4 L41 4 L41 42 L39 42" stroke="#4F46E5" strokeWidth="4" strokeLinecap="square" />
    </svg>
  )
}

export function CoachGatewayPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { application: existing, loading } = useCoachApplication()

  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [years, setYears] = useState('')
  const [license, setLicense] = useState('')
  const [clubName, setClubName] = useState('')
  const [credFile, setCredFile] = useState('')
  const [logoFile, setLogoFile] = useState('')
  const [error, setError] = useState('')
  const [openSlots, setOpenSlots] = useState(null)

  // Real free-slot count: platform clubs with no head coach and not archived.
  useEffect(() => {
    listClubs()
      .then((clubs) => {
        const free = clubs.filter((c) => !c.archived && !c.headCoachName).length
        setOpenSlots(free)
      })
      .catch(() => setOpenSlots(null))
  }, [])

  // Hydrate from an existing application once it loads. Only a *pending*
  // request shows the "awaiting approval" view — an approved coach is
  // redirected to their workspace (below), and a declined coach gets the
  // form back, pre-filled, so they can revise and resubmit.
  useEffect(() => {
    if (!existing) return
    setSubmitted(existing.status === 'pending')
    setName(existing.fullName || user?.name || '')
    setYears(String(existing.yearsExperience ?? ''))
    setLicense(existing.licenseNumber || '')
    setClubName(existing.clubName || '')
    setCredFile(existing.credentialDocUrl ? 'credential.pdf' : '')
    setLogoFile(existing.clubLogoUrl ? 'crest.png' : '')
  }, [existing, user])

  const credInputRef = useRef(null)
  const logoInputRef = useRef(null)

  const summary = [
    { k: 'Full Name', v: name || 'Not provided', tone: name ? 'set' : 'muted' },
    { k: 'License', v: license || 'Not provided', tone: license ? 'set' : 'muted' },
    { k: 'Experience', v: years ? `${years} yrs` : 'Not provided', tone: years ? 'set' : 'muted' },
    { k: 'Credentials', v: credFile || 'No file attached', tone: credFile ? 'file' : 'muted' },
    { k: 'Club', v: clubName || 'Unnamed club', tone: clubName ? 'set' : 'muted' },
    { k: 'Squad Capacity', v: `${SQUAD_CAP} players`, tone: 'set' },
    { k: 'Club Logo', v: logoFile || 'No file attached', tone: logoFile ? 'file' : 'muted' },
  ]

  const pipeline = [
    { step: 'Step 1', label: 'Submitted', state: 'done' },
    { step: 'Step 2', label: 'Admin Verification', state: 'active' },
    { step: 'Step 3', label: 'Squad Rights Granted', state: 'upcoming' },
  ]

  function pickCred(event) {
    setCredFile(event.target.files?.[0]?.name || '')
  }

  function pickLogo(event) {
    setLogoFile(event.target.files?.[0]?.name || '')
  }

  async function handleSubmit() {
    setError('')
    try {
      await applyAsCoach({
        fullName: name.trim(),
        yearsExperience: parseInt(years, 10) || 0,
        licenseNumber: license.trim() || null,
        clubName: clubName.trim(),
        squadCapacity: SQUAD_CAP,
        credentialDocUrl: credFile ? 'https://example.com/credential.pdf' : null,
        clubLogoUrl: logoFile ? 'https://example.com/crest.png' : null,
      })
      await refreshCoachApplication()
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your request. Check the form and try again.')
    }
  }

  const toneClass = (tone) =>
    tone === 'set' ? 'is-set' : tone === 'file' ? 'is-file' : ''

  // The Platform Evaluator is a coach-role account with no club onboarding.
  if (user?.organization === 'Platform Evaluator') {
    return <Navigate to="/coach/evaluator" replace />
  }

  // An approved coach has a live workspace — never keep them on the
  // onboarding gateway (that showed a stale "Pending Verification" screen).
  // The status is revalidated on mount, so an approval granted elsewhere is
  // picked up on the next visit even without a page reload.
  if (existing?.status === 'approved') {
    return <Navigate to="/coach/club" replace />
  }

  const declined = existing?.status === 'declined'
  // Only block the page on load when we have nothing cached to show yet.
  const showLoading = loading && !existing

  return (
    <div className="cg">
      <div className="cg__grid" />
      <div className="cg__glow-a" />
      <div className="cg__glow-b" />

      <header className="cg__header">
        <Link to="/" className="cg__brand">
          <BrandMark />
          <span className="cg__wordmark">OVRX</span>
        </Link>
        <span className="cg__header-tag">Coach Registration · Onboarding</span>
      </header>

      <section className="cg__intro">
        <div className="cg__intro-copy">
          <span className="cg__kicker">Coach Gateway</span>
          <h1 className="cg__title">Coach Registration &amp; Club Management Request</h1>
          <p className="cg__lead">
            Submit your request to open and manage one of the 8 official platform club slots. A
            platform admin reviews every request before management rights are granted.
          </p>
        </div>
      </section>

      {showLoading && (
        <section className="cg__layout">
          <p className="cg__lead">Loading your registration status…</p>
        </section>
      )}

      {!showLoading && !submitted && (
        <section className="cg__layout">
          <div className="cg__main">
            <div className="cg__step">
              <span className="cg__step-kicker">Step 01 · Credentials</span>
              <span className="cg__step-title">Coaching Identity</span>
            </div>

            {declined && (
              <p className="cg__pending-banner">
                Your previous request was declined
                {existing?.reviewNote ? `: ${existing.reviewNote}` : '.'} Update your details below
                and resubmit for review.
              </p>
            )}

            <div className="cg__grid-fields">
              <label className="cg__field">
                <span className="cg__field-label">Full Name</span>
                <input
                  className="cg__input"
                  type="text"
                  placeholder="e.g. Marcus Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="cg__field">
                <span className="cg__field-label">Years of Experience</span>
                <input
                  className="cg__input"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="e.g. 7"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </label>
              <label className="cg__field">
                <span className="cg__field-label">License Number</span>
                <input
                  className="cg__input cg__input--license"
                  type="text"
                  placeholder="UEFA-B-000000"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                />
              </label>
              <div className="cg__field">
                <span className="cg__field-label">UEFA Credentials Upload</span>
                <button
                  type="button"
                  className={`cg__upload ${credFile ? 'is-attached' : ''}`}
                  onClick={() => credInputRef.current?.click()}
                >
                  <span className="cg__upload-icon">
                    <UploadIcon />
                  </span>
                  <span className="cg__upload-text">
                    <span className="cg__upload-label">
                      {credFile ? `${credFile} attached` : 'Upload credential document'}
                    </span>
                    <span className="cg__upload-hint">PDF or JPG · max 8 MB</span>
                  </span>
                </button>
                <input
                  ref={credInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg"
                  hidden
                  onChange={pickCred}
                />
              </div>
            </div>

            <div className="cg__step cg__step--divided">
              <span className="cg__step-kicker">Step 02 · Club Details</span>
              <span className="cg__step-title">Your Club</span>
            </div>

            <div className="cg__panel cg__panel--club">
              <span className="cg__panel-kicker">Club Details</span>
              <div className="cg__panel-grid">
                <label className="cg__field">
                  <span className="cg__field-label">Club Name</span>
                  <input
                    className="cg__input cg__input--club"
                    type="text"
                    placeholder="e.g. Northgate Union"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                  />
                </label>
                <div className="cg__field">
                  <span className="cg__field-label">Club Logo Upload</span>
                  <button
                    type="button"
                    className={`cg__upload cg__upload--logo ${logoFile ? 'is-attached' : ''}`}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <span className="cg__upload-badge">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="cg__upload-icon"
                      >
                        <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                      </svg>
                    </span>
                    <span className="cg__upload-label">
                      {logoFile ? `${logoFile} attached` : 'Upload club crest'}
                    </span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    hidden
                    onChange={pickLogo}
                  />
                </div>
              </div>
              <div className="cg__capacity-wrap">
                <span className="cg__field-label">Squad Capacity</span>
                <span className="cg__panel-hint">
                  Every platform club runs a fixed {SQUAD_CAP}-player squad · 5v5 matchday format.
                </span>
              </div>
            </div>

            <div className="cg__submit-row">
              <button type="button" className="cg__submit-btn" onClick={handleSubmit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
                </svg>
                Submit Request for Approval
              </button>
              <span className="cg__submit-hint">
                {error || 'Platform admins review coach requests within 48 hours.'}
              </span>
            </div>
          </div>

          <div className="cg__side">
            <div className="cg__card">
              <span className="cg__card-title">Request Summary</span>
              {summary.map((s) => (
                <div key={s.k} className="cg__summary-row">
                  <span className="cg__summary-k">{s.k}</span>
                  <span className={`cg__summary-v ${toneClass(s.tone)}`}>{s.v}</span>
                </div>
              ))}
            </div>
            <div className="cg__slots-card">
              <span className="cg__slots-kicker">Slot availability</span>
              <span className="cg__slots-value">
                {openSlots ?? '—'}
                <span className="cg__slots-value-sub"> / {CLUB_SLOTS} clubs open</span>
              </span>
              <span className="cg__slots-note">
                A club slot is assigned to your account on approval. A separate Platform Evaluator
                account reviews every player's baseline session.
              </span>
            </div>
          </div>
        </section>
      )}

      {!showLoading && submitted && (
        <section className="cg__layout">
          <div className="cg__pending-main">
            <div className="cg__pending-head">
              <h2 className="cg__pending-title">Request Submitted — Awaiting Admin Approval</h2>
              <span className="cg__pending-pill">
                <span className="cg__pending-pill-dot" />
                <span className="cg__pending-pill-label">Pending Verification</span>
              </span>
            </div>

            <p className="cg__pending-banner">
              Your request to open and manage a club has been sent to platform admins. Once approved,
              you will gain full management rights over your squad roster and player training queue.
              Until then, the platform stays read-only for your account.
            </p>

            <div className="cg__pending-summary">
              {summary.map((s) => (
                <div key={s.k} className="cg__pending-summary-cell">
                  <span className="cg__pending-summary-k">{s.k}</span>
                  <span className={`cg__pending-summary-v ${toneClass(s.tone)}`}>{s.v}</span>
                </div>
              ))}
            </div>

            <div className="cg__pipeline">
              {pipeline.map((p) => (
                <div key={p.step} className={`cg__pipeline-step cg__pipeline-step--${p.state}`}>
                  <span className="cg__pipeline-step-num">{p.step}</span>
                  <span className="cg__pipeline-step-label">{p.label}</span>
                </div>
              ))}
            </div>

            <div className="cg__pending-actions">
              <button type="button" className="cg__home-btn" onClick={() => navigate('/')}>
                <HomeArrowIcon />
                Return to OVRX Home
              </button>
              <span className="cg__pending-track">
                <span className="cg__pending-track-dot" />
                Awaiting a platform admin's review
              </span>
            </div>
          </div>

          <div className="cg__unlocks">
            <span className="cg__card-title">What unlocks on approval</span>
            {CLUB_UNLOCKS.map((t, i) => (
              <div key={t} className="cg__unlock-row">
                <span className="cg__unlock-num">{i + 1}</span>
                <span className="cg__unlock-text">{t}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="cg__spacer" />

      <footer className="cg__footer">
        <div className="cg__footer-top">
          <div className="cg__footer-brand">
            <BrandMark size={22} />
            <span className="cg__footer-wordmark">OVRX</span>
            <span className="cg__footer-tagline">Real Sweat. Real Stats.</span>
          </div>
          <div className="cg__footer-nav">
            <Link to="/">Home</Link>
            <span className="cg__footer-locked">
              Club <LockIcon />
            </span>
            <span className="cg__footer-locked">
              Squad <LockIcon />
            </span>
            <span className="cg__footer-locked">
              Review Queue <LockIcon />
            </span>
            <Link to="/leagues">Leagues</Link>
          </div>
        </div>
        <div className="cg__footer-bottom">
          <span>© 2026 OVRX. All rights reserved.</span>
          <span className="cg__footer-legal">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
