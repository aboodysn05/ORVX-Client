import { useState } from 'react'

// Password input with a lock icon and a show/hide toggle.
// Used by both the sign-in and create-account forms.
export function PasswordField({
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="auth__field">
      <label className="auth__label">{label}</label>
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
          <rect x="4" y="10" width="16" height="11" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <input
          className="auth__input auth__input--password"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="auth__pw-toggle"
          aria-label="Toggle password visibility"
          onClick={() => setShow((prev) => !prev)}
        >
          {show ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l18 18" />
              <path d="M10.6 5.1A9 9 0 0 1 21 12a17 17 0 0 1-2.6 3.4M6.6 6.6A17 17 0 0 0 3 12a9 9 0 0 0 12.9 4" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
