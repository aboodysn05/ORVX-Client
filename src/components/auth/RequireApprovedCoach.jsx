import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCoachApplication } from '../../hooks/useCoachApplication'

// Route guard for the coach workspace (Club / Squad / Review Queue). Only a
// coach whose club-management application has been APPROVED gets in:
//  - signed out            -> /login
//  - not a coach            -> /
//  - Platform Evaluator     -> /coach/evaluator (they run no club)
//  - coach, not yet approved -> /coach/gateway (shows their pending / form state)
//
// The application status is revalidated on every mount (see useCoachApplication).
// We only hold the page back (blank) while there's NO known status yet; once a
// value is known — cached or fresh — we act on it. Revalidation still runs, so
// if a later fetch flips the status the guard re-renders and redirects.
export function RequireApprovedCoach({ children }) {
  const { user } = useAuth()
  const { application, loading } = useCoachApplication()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'coach') return <Navigate to="/" replace />
  if (user.organization === 'Platform Evaluator') return <Navigate to="/coach/evaluator" replace />

  if (loading && application == null) return null

  if (application?.status !== 'approved') return <Navigate to="/coach/gateway" replace />

  return children
}
