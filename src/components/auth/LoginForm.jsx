import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { destForRole } from '../../utils/authRedirect'
import { PasswordField } from './PasswordField'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      navigate(destForRole(user?.role))
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "That email and password don't match an OVRX account.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth__panel" onSubmit={handleSubmit}>
      <div className="auth__field">
        <label className="auth__label">Email Address</label>
        <div className="auth__input-wrap">
          <svg
            className="auth__input-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A6784"
            strokeWidth="2"
          >
            <rect x="2" y="4" width="20" height="16" />
            <path d="M2 6l10 7 10-7" />
          </svg>
          <input
            className="auth__input"
            type="email"
            placeholder="you@club.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <PasswordField
        value={password}
        onChange={(event) => {
          setPassword(event.target.value)
          setError('')
        }}
        autoComplete="current-password"
      />

      <div className="auth__row">
        <button
          type="button"
          className="auth__check-btn"
          onClick={() => setRemember((prev) => !prev)}
        >
          <span className={`auth__checkbox ${remember ? 'is-checked' : ''}`}>
            {remember && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <path d="M4 12l5 5L20 6" />
              </svg>
            )}
          </span>
          Remember me
        </button>
        <a href="#" className="auth__forgot">
          Forgot Password?
        </a>
      </div>

      {error && (
        <span className="auth__error">
          <svg
            className="auth__error-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16.5v.5" />
          </svg>
          <span>{error}</span>
        </span>
      )}

      <button type="submit" className="auth__submit" disabled={submitting}>
        {submitting ? 'Signing In…' : 'Sign In'}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  )
}
