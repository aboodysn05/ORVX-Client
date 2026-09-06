import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireApprovedCoach } from './components/auth/RequireApprovedCoach'
import { HeroPage } from './pages/HeroPage'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { DrillsPage } from './pages/DrillsPage'
import { LeaguesPage } from './pages/LeaguesPage'
import { AboutPage } from './pages/AboutPage'
import { PlayerAssessmentPage } from './pages/PlayerAssessmentPage'
import { CoachGatewayPage } from './pages/CoachGatewayPage'
import { CoachClubProfilePage } from './pages/CoachClubProfilePage'
import { CoachReviewQueuePage } from './pages/CoachReviewQueuePage'
import { CoachSquadManagerPage } from './pages/CoachSquadManagerPage'
import { EvaluatorConsolePage } from './pages/EvaluatorConsolePage'
import { TrainPage } from './pages/TrainPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { SubmitProofPage } from './pages/SubmitProofPage'
import { AdminOverviewPage } from './pages/AdminOverviewPage'
import { AdminRequestsPage } from './pages/AdminRequestsPage'
import { AdminClubsPage } from './pages/AdminClubsPage'
import { AdminDrillsPage } from './pages/AdminDrillsPage'
import { AdminLeaguesPage } from './pages/AdminLeaguesPage'

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
        path="/coach/gateway"
        element={
          <RequireAuth>
            <CoachGatewayPage />
          </RequireAuth>
        }
      />
      <Route
        path="/coach/club"
        element={
          <RequireApprovedCoach>
            <CoachClubProfilePage />
          </RequireApprovedCoach>
        }
      />
      <Route
        path="/coach/squad"
        element={
          <RequireApprovedCoach>
            <CoachSquadManagerPage />
          </RequireApprovedCoach>
        }
      />
      <Route
        path="/coach/review"
        element={
          <RequireApprovedCoach>
            <CoachReviewQueuePage />
          </RequireApprovedCoach>
        }
      />
      <Route
        path="/coach/evaluator"
        element={
          <RequireAuth>
            <EvaluatorConsolePage />
          </RequireAuth>
        }
      />
      <Route
        path="/train"
        element={
          <RequireAuth>
            <TrainPage />
          </RequireAuth>
        }
      />
      <Route
        path="/workout"
        element={
          <RequireAuth>
            <WorkoutPage />
          </RequireAuth>
        }
      />
      <Route
        path="/submit-proof"
        element={
          <RequireAuth>
            <SubmitProofPage />
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
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminOverviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <RequireAuth>
            <AdminRequestsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/clubs"
        element={
          <RequireAuth>
            <AdminClubsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/drills"
        element={
          <RequireAuth>
            <AdminDrillsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/leagues"
        element={
          <RequireAuth>
            <AdminLeaguesPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
