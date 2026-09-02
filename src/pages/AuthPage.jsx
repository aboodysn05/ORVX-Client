import { Link, useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import '../styles/auth.css'

// OVRX sign-in / create-account screen. Rendered at both /login and
// /register; the `mode` prop decides which tab is active.
export function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const isLogin = mode !== 'register'

  return (
    <div className="auth">
      <div className="auth__grid" />
      <div className="auth__ring" />
      <div className="auth__scanline" />
      <div className="auth__glow" />

      <div className="auth__inner">
        <Link to="/" className="auth__brand">
          <svg
            className="auth__brand-logo"
            width="46"
            height="46"
            viewBox="0 0 46 46"
            fill="none"
          >
            <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="4" strokeLinecap="square" />
            <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="4" strokeLinecap="square" opacity="0.55" />
            <path d="M38 4 L40 4 L40 42 L38 42" stroke="#4F46E5" strokeWidth="3" strokeLinecap="square" />
          </svg>
          <div className="auth__wordmark">OVRX</div>
          <div className="auth__tagline">Real Sweat. Real Stats.</div>
        </Link>

        <div className="auth__card">
          <div className="auth__tabs">
            <button
              type="button"
              className={`auth__tab ${isLogin ? 'is-active' : ''}`}
              onClick={() => navigate('/login')} //Redirect While Rendering
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth__tab ${!isLogin ? 'is-active' : ''}`}
              onClick={() => navigate('/register')} //Redirect While Rendering
            >
              Create Account
            </button>
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>

        <p className="auth__terms">
          By continuing you agree to the{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
