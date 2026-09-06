import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCoachApplication } from '../../hooks/useCoachApplication'
import { cardName, initials } from '../../utils/playerCard'
import '../../styles/coach-nav.css'

const LINKS = [
  { label: 'Club', to: '/coach/club' },
  { label: 'Squad', to: '/coach/squad' },
  { label: 'Review Queue', to: '/coach/review' },
  { label: 'Leagues', to: '/leagues' },
]

// Platform Evaluator ("Coach #9") is a coach-role account flagged by
// organization. They run no club — no Club / Squad / Review Queue surfaces —
// so their nav is just the Baseline Console plus the public Leagues page.
const EVALUATOR_LINKS = [
  { label: 'Baseline Console', to: '/coach/evaluator' },
  { label: 'Leagues', to: '/leagues' },
]

// Top navigation for a signed-in coach — the coach-side equivalent of
// PlayerNav. The workspace links are shown once a coach has submitted their
// club-management request (see utils/coachApplication.js); an amber sub-label
// on the chip marks the request as still pending admin approval.
export function CoachNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isEvaluator = user?.organization === 'Platform Evaluator'
  const { application } = useCoachApplication()
  const status = application?.status
  const pending = status === 'pending'
  const declined = status === 'declined'
  const approved = status === 'approved'
  const chipTo = isEvaluator ? '/coach/evaluator' : approved ? '/coach/club' : '/coach/gateway'
  const chipSub = isEvaluator
    ? 'Platform Evaluator'
    : approved
      ? application?.clubName || 'Coach'
      : pending
        ? 'Pending Approval'
        : declined
          ? 'Application Declined'
          : 'Coach'

  function handleSignOut() {
    logout()
    navigate('/')
  }

  return (
    <nav className="cnav">
      <Link to="/" className="cnav__brand">
        <svg width="28" height="28" viewBox="0 0 46 46" fill="none">
          <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" />
          <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" opacity="0.5" />
          <path d="M39 4 L41 4 L41 42 L39 42" stroke="#4F46E5" strokeWidth="4" strokeLinecap="square" />
        </svg>
        <span className="cnav__brand-text">
          <span className="cnav__brand-name">OVRX</span>
          <span className="cnav__brand-tag">Real Sweat. Real Stats.</span>
        </span>
      </Link>

      {isEvaluator ? (
        <div className="cnav__links">
          {EVALUATOR_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `cnav__link ${isActive || pathname.startsWith(link.to) ? 'is-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ) : approved ? (
        <div className="cnav__links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `cnav__link ${isActive || pathname.startsWith(link.to) ? 'is-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ) : (
        <Link to="/coach/gateway" className="cnav__link cnav__link--cta">
          {pending
            ? 'Registration Pending Approval →'
            : declined
              ? 'Update Coach Registration →'
              : 'Complete Coach Registration →'}
        </Link>
      )}

      <div className="cnav__account">
        <Link to={chipTo} className="cnav__chip">
          <span className="cnav__avatar">{initials(user?.name)}</span>
          <span className="cnav__chip-text">
            <span className="cnav__chip-name">{cardName(user?.name)}</span>
            <span className={`cnav__chip-sub ${pending ? 'is-pending' : ''}`}>{chipSub}</span>
          </span>
        </Link>
        <button
          type="button"
          className="cnav__signout"
          aria-label="Sign out"
          onClick={handleSignOut}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
            <path d="M10 8l-4 4 4 4M6 12h9" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
