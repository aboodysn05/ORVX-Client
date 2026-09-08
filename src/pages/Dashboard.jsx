import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { destForUser } from '../utils/authRedirect'
import { PlayerDashboardPage } from './PlayerDashboardPage'

// Role router for /dashboard. Players get the full player dashboard; a coach or
// admin who lands here (e.g. by typing the URL) is bounced to their own home.
export function Dashboard() {
  const { user } = useAuth()

  if (user?.role === 'player') {
    return <PlayerDashboardPage />
  }
  return <Navigate to={destForUser(user)} replace />
}
