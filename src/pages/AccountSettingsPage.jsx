import { useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { useAuth } from '../hooks/useAuth'
import { updateAccount } from '../api/auth'
import '../styles/account-settings.css'

// Account settings for any signed-in user. Name is a free edit; changing the
// email or password requires the current password. On success the auth context
// is updated in place (the JWT still carries only id + role).
export function AccountSettingsPage() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const emailChanged = email.trim().toLowerCase() !== (user?.email || '').toLowerCase()
  const wantsPassword = newPassword.length > 0
  const needsCurrent = emailChanged || wantsPassword
  const dirty = name.trim() !== (user?.name || '') || emailChanged || wantsPassword

  async function onSubmit(e) {
    e.preventDefault()
    if (busy || !dirty) return
    setError('')
    setOk('')
    if (needsCurrent && !currentPassword) {
      setError('Enter your current password to change your email or password.')
      return
    }
    setBusy(true)
    try {
      const payload = { name: name.trim() }
      if (emailChanged) payload.email = email.trim()
      if (wantsPassword) payload.newPassword = newPassword
      if (needsCurrent) payload.currentPassword = currentPassword
      const updated = await updateAccount(payload)
      updateUser({ name: updated.name, email: updated.email })
      setCurrentPassword('')
      setNewPassword('')
      setOk('Saved.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <section className="acct">
        <h1 className="acct__title">Account Settings</h1>
        <p className="acct__lead">
          Signed in as <span className="acct__role">{user?.role}</span>. Update your name any time;
          email and password changes need your current password.
        </p>

        <form className="acct__form" onSubmit={onSubmit}>
          <label className="acct__field">
            <span className="acct__label">Full name</span>
            <input
              className="acct__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>

          <label className="acct__field">
            <span className="acct__label">Email</span>
            <input
              className="acct__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <div className="acct__divider">Change password</div>

          <label className="acct__field">
            <span className="acct__label">New password</span>
            <input
              className="acct__input"
              type="password"
              value={newPassword}
              placeholder="Leave blank to keep current"
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="acct__field">
            <span className="acct__label">
              Current password {needsCurrent && <span className="acct__req">· required</span>}
            </span>
            <input
              className="acct__input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="acct__msg acct__msg--err">{error}</p>}
          {ok && <p className="acct__msg acct__msg--ok">{ok}</p>}

          <button type="submit" className="acct__save" disabled={busy || !dirty}>
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </section>
    </PageShell>
  )
}
