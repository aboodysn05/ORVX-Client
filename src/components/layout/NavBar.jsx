import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/nav.css'

// Reusable site navigation. Shows a Sign In / Register button for guests
// and a user chip + Log out for signed-in users.
const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Drills', to: '/drills' },
  { label: 'Leagues', to: '/leagues' },
  { label: 'About', to: '/about' },
]

function initialsOf(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function NavBar() {
  const { user, logout } = useAuth()

  return (
    <nav className="nav">
      <Link to="/" className="nav__brand">
        <svg
          className="nav__brand-logo"
          width="28"
          height="28"
          viewBox="0 0 46 46"
          fill="none"
        >
          <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" />
          <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" opacity="0.5" />
          <path d="M39 4 L41 4 L41 42 L39 42" stroke="#4F46E5" strokeWidth="4" strokeLinecap="square" />
        </svg>
        <span className="nav__brand-text">
          <span className="nav__brand-name">OVRX</span>
          <span className="nav__brand-tag">Real Sweat. Real Stats.</span>
        </span>
      </Link>

      <div className="nav__links">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="nav__actions">
        {user ? (
          <>
            <span className="nav__chip">
              <span className="nav__chip-avatar">{initialsOf(user.name)}</span>
              <span className="nav__chip-text">
                <span className="nav__chip-name">{user.name}</span>
                <span className="nav__chip-sub">{user.role}</span>
              </span>
            </span>
            <button type="button" className="nav__logout" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="nav__cta">
            Sign In / Register
          </Link>
        )}
      </div>
    </nav>
  )
}
