import { useAuth } from '../../hooks/useAuth'
import { NavBar } from './NavBar'
import { PlayerNav } from './PlayerNav'

// Picks the right top navigation for the current visitor so every page stays
// consistent: a signed-in player always gets the player nav (identity chip +
// OVR badge + sign-out), everyone else gets the public marketing nav.
export function SiteNav() {
  const { user } = useAuth()
  if (user?.role === 'player') {
    return <PlayerNav />
  }
  return <NavBar />
}
