import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Route guard: sends signed-out visitors to the login page.
// Role-specific guards (Player / Coach / Admin) build on this in a later branch.
export function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}
