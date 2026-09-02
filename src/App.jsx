import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

// All route definitions live here.
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
