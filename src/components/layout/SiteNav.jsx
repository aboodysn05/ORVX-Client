import { useAuth } from '../../hooks/useAuth'
import { NavBar } from './NavBar'
import { PlayerNav } from './PlayerNav'
import { CoachNav } from './CoachNav'
import { AdminNav } from './AdminNav'

// Picks the right top navigation for the current visitor so every page stays
// consistent: a signed-in player gets the player nav, a signed-in coach gets
// the coach workspace nav, an admin gets the sys-admin console nav, and
// everyone else gets the public marketing nav.
export function SiteNav() {
  const { user } = useAuth()
  if (user?.role === 'player') {
    return <PlayerNav />
  }
  if (user?.role === 'coach') {
    return <CoachNav />
  }
  if (user?.role === 'admin') {
    return <AdminNav />
  }
  return <NavBar />
}
