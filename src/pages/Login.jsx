import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthCard } from '../components/layout/AuthCard'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to sign in. Check your email and password.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Sign in to ORVX" subtitle="Track your football development.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        New to ORVX?{' '}
        <Link className="font-medium text-emerald-600 hover:underline" to="/register">
          Create an account
        </Link>
      </p>
    </AuthCard>
  )
}
