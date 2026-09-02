import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

// Placeholder landing page for signed-in users. Role dashboards replace this
// in the next branch; for now it just proves the auth flow end to end.
export function Home() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
      <p className="text-slate-500">
        Signed in as <span className="font-medium">{user?.role}</span>. Dashboards
        arrive in the next branch.
      </p>
      <div className="w-40">
        <Button onClick={logout}>Log out</Button>
      </div>
    </div>
  )
}
