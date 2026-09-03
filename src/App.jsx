import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { HeroPage } from './pages/HeroPage'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { DrillsPage } from './pages/DrillsPage'
import { LeaguesPage } from './pages/LeaguesPage'
import { AboutPage } from './pages/AboutPage'
import { PlayerAssessmentPage } from './pages/PlayerAssessmentPage'

// All route definitions live here.
function App() {
  return (
    <Routes>
      <Route path="/" element={<HeroPage />} />
      <Route path="/drills" element={<DrillsPage />} />
      <Route path="/leagues" element={<LeaguesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/assessment"
        element={
          <RequireAuth>
            <PlayerAssessmentPage />
          </RequireAuth>
        }
      />
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
