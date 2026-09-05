import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cardName, initials } from '../../utils/playerCard'
import '../../styles/admin-nav.css'

const LINKS = [
  { label: 'Overview', to: '/admin' },
  { label: 'Requests', to: '/admin/requests' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Clubs', to: '/admin/clubs' },
  { label: 'Drills', to: '/admin/drills' },
  { label: 'Leagues', to: '/admin/leagues' },
]

// Sys-Admin console nav — the admin-side equivalent of PlayerNav / CoachNav.
export function AdminNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function handleSignOut() {
    logout()
    navigate('/')
  }

  return (
    <nav className="anav">
      <Link to="/admin" className="anav__brand">
        <svg width="28" height="28" viewBox="0 0 46 46" fill="none">
          <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" />
          <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" opacity="0.5" />
          <path d="M39 4 L41 4 L41 42 L39 42" stroke="#4F46E5" strokeWidth="4" strokeLinecap="square" />
        </svg>
        <span className="anav__wordmark">OVRX</span>
        <span className="anav__divider" />
        <span className="anav__tag">Sys-Admin</span>
      </Link>

      <div className="anav__links">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            className={({ isActive }) =>
              `anav__link ${
                isActive || (link.to !== '/admin' && pathname.startsWith(link.to)) ? 'is-active' : ''
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="anav__account">
        <Link to="/admin" className="anav__chip">
          <span className="anav__avatar">{initials(user?.name)}</span>
          <span className="anav__chip-text">
            <span className="anav__chip-name">{cardName(user?.name)}</span>
            <span className="anav__chip-sub">Root Access</span>
          </span>
        </Link>
        <button type="button" className="anav__signout" aria-label="Sign out" onClick={handleSignOut}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
            <path d="M10 8l-4 4 4 4M6 12h9" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
