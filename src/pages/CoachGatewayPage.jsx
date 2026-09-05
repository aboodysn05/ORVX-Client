import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { readCoachApplication, saveCoachApplication } from '../utils/coachApplication'
import '../styles/coach-gateway.css'

// Coach onboarding — translated from the design canvas (OVRX Coach Gateway.dc.html).
// Frontend only: the request is persisted to localStorage (see
// utils/coachApplication.js), not sent to a backend. Only one path exists —
// requesting to open/manage a club. The "platform evaluator" role from the
// design is a platform-assigned coach with their own onboarding, built later.

const OPEN_CLUB_SLOTS = 2 // slots 6 and 8 in the design's slot matrix
const CAPACITIES = [10, 12, 16, 20]

const CLUB_UNLOCKS = [
  'Full management rights over your squad roster.',
  'Approve or reject player training submissions.',
  'Enter match results and league fixtures.',
  'Scout free agents who completed their 3-session baseline.',
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
  const existing = readCoachApplication(user?.email)

  const [submitted, setSubmitted] = useState(Boolean(existing))
  const [name, setName] = useState(existing?.name || user?.name || '')
  const [years, setYears] = useState(existing?.years || '')
  const [license, setLicense] = useState(existing?.license || '')
  const [clubName, setClubName] = useState(existing?.clubName || '')
  const [capacity, setCapacity] = useState(existing?.capacity || 16)
  const [credFile, setCredFile] = useState(existing?.credFile || '')
  const [logoFile, setLogoFile] = useState(existing?.logoFile || '')

  const credInputRef = useRef(null)
  const logoInputRef = useRef(null)

  const summary = [
    { k: 'Full Name', v: name || 'Not provided', tone: name ? 'set' : 'muted' },
    { k: 'License', v: license || 'Not provided', tone: license ? 'set' : 'muted' },
    { k: 'Experience', v: years ? `${years} yrs` : 'Not provided', tone: years ? 'set' : 'muted' },
    { k: 'Credentials', v: credFile || 'No file attached', tone: credFile ? 'file' : 'muted' },
    { k: 'Club', v: clubName || 'Unnamed club', tone: clubName ? 'set' : 'muted' },
    { k: 'Squad Capacity', v: `${capacity} players`, tone: 'set' },
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

  function handleSubmit() {
    saveCoachApplication(user?.email, { name, years, license, clubName, capacity, credFile, logoFile })
    setSubmitted(true)
  }

  const toneClass = (tone) =>
    tone === 'set' ? 'is-set' : tone === 'file' ? 'is-file' : ''

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

      {!submitted && (
        <section className="cg__layout">
          <div className="cg__main">
            <div className="cg__step">
              <span className="cg__step-kicker">Step 01 · Credentials</span>
              <span className="cg__step-title">Coaching Identity</span>
            </div>

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
                <div className="cg__capacity">
                  {CAPACITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`cg__capacity-btn ${capacity === c ? 'is-active' : ''}`}
                      onClick={() => setCapacity(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <span className="cg__panel-hint">
                  5v5 format · minimum 10 registered players per matchday squad.
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
                Platform admins review coach requests within 48 hours.
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
                {OPEN_CLUB_SLOTS}
                <span className="cg__slots-value-sub"> / 8 clubs open</span>
              </span>
              <span className="cg__slots-note">
                Slot 9 is reserved for the OVRX Platform Evaluator and is currently filled by Coach #9.
              </span>
            </div>
          </div>
        </section>
      )}

      {submitted && (
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
                Tracking · Slot 6 in the club matrix
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
