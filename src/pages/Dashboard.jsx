import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { PlayerDashboardPage } from './PlayerDashboardPage'

// Role router for /dashboard. Players get the full player dashboard; coach and
// admin dashboards arrive on later branches, so for now they see the
// placeholder that proves the auth flow end to end.
export function Dashboard() {
  const { user, logout } = useAuth()

  if (user?.role === 'player') {
    return <PlayerDashboardPage />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
      <p className="text-slate-500">
        Signed in as <span className="font-medium">{user?.role}</span>. Dashboards
        arrive in a later branch.
      </p>
      <div className="w-40">
        <Button onClick={logout}>Log out</Button>
      </div>
    </div>
  )
}
