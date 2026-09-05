import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getMyProfile } from '../../api/players'
import { cardName, initials } from '../../utils/playerCard'
import '../../styles/player-nav.css'

const LINKS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Train', to: '/train', alsoActive: ['/workout'] },
  { label: 'Drills', to: '/drills' },
  { label: 'Leagues', to: '/leagues' },
]

// Sticky top navigation for a signed-in player. Self-contained: it reads the
// player's own profile for the OVR badge, so it can be dropped onto any page
// (the dashboard renders it directly; SiteNav renders it on the public pages
// whenever a player is signed in).
export function PlayerNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [profile, setProfile] = useState(null)

  // Best-effort: the OVR badge just doesn't render if this fails or the
  // player hasn't completed the assessment yet (same as before, when a
  // missing localStorage entry meant profile was null).
  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function handleSignOut() {
    logout()
    navigate('/')
  }

  return (
    <nav className="dash-nav">
      <Link to="/dashboard" className="dash-nav__brand">
        <svg width="28" height="28" viewBox="0 0 46 46" fill="none">
          <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" />
          <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" opacity="0.5" />
          <path d="M39 4 L41 4 L41 42 L39 42" stroke="#4F46E5" strokeWidth="4" strokeLinecap="square" />
        </svg>
        <span className="dash-nav__brand-text">
          <span className="dash-nav__brand-name">OVRX</span>
          <span className="dash-nav__brand-tag">Real Sweat. Real Stats.</span>
        </span>
      </Link>

      <div className="dash-nav__links">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `dash-nav__link ${isActive || link.alsoActive?.includes(pathname) ? 'is-active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="dash-nav__account">
        <Link to="/dashboard" className="dash-nav__chip">
          <span className="dash-nav__avatar">{initials(user?.name)}</span>
          <span className="dash-nav__chip-text">
            <span className="dash-nav__chip-name">{cardName(user?.name)}</span>
            <span className="dash-nav__chip-role">{profile?.position || 'Player'}</span>
          </span>
          {profile ? (
            <span className="dash-nav__ovr">
              <span className="dash-nav__ovr-value">{profile.overall}</span>
              <span className="dash-nav__ovr-label">OVR</span>
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          className="dash-nav__signout"
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
