import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { HeroPage } from './pages/HeroPage'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'

// All route definitions live here.
function App() {
  return (
    <Routes>
      <Route path="/" element={<HeroPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
