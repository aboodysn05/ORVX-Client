import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PasswordField } from './PasswordField'

const ROLES = [
  {
    value: 'player',
    label: 'Player',
    description: 'Track attributes, submit drills, join clubs',
  },
  {
    value: 'coach',
    label: 'Coach',
    description: 'Build drills, review player video submissions, manage roster',
  },
]

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('player')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [club, setClub] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = { name, email, password, role }
      if (role === 'coach' && club) {
        payload.organization = club
      }
      await register(payload)
      // Players run the onboarding assessment first; coaches go straight in.
      navigate(role === 'player' ? '/assessment' : '/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to create your account. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth__panel" onSubmit={handleSubmit}>
      <div className="auth__field auth__field--role">
        <label className="auth__label">I am a</label>
        <div className="auth__roles">
          {ROLES.map((option) => {
            const active = role === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`auth__role ${active ? 'is-active' : ''}`}
                onClick={() => setRole(option.value)}
              >
                <span className="auth__role-head">
                  <span className={`auth__radio ${active ? 'is-active' : ''}`}>
                    {active && <span className="auth__radio-dot" />}
                  </span>
                  <span className="auth__role-title">{option.label}</span>
                </span>
                <span className="auth__role-desc">{option.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="auth__field">
        <label className="auth__label">Full Name</label>
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
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
          </svg>
          <input
            className="auth__input"
            type="text"
            placeholder="Jordan Adeyemi"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </div>
      </div>

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
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <PasswordField
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="8+ characters"
        autoComplete="new-password"
      />

      {role === 'coach' && (
        <div className="auth__field">
          <label className="auth__label">Club Name or Organization Code</label>
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
              <path d="M4 21V6l8-3v18M12 21h8V10l-8-2" />
            </svg>
            <input
              className="auth__input"
              type="text"
              placeholder="Northgate FC / NG-4471"
              value={club}
              onChange={(event) => setClub(event.target.value)}
            />
          </div>
        </div>
      )}

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
        {submitting ? 'Creating Account…' : 'Create Account'}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  )
}
