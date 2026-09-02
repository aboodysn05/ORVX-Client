import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthCard } from '../components/layout/AuthCard'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

const ROLE_OPTIONS = [
  { value: 'player', label: 'Player' },
  { value: 'coach', label: 'Coach' },
]

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'player',
  })
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
      await register(form)
      navigate('/')
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
    <AuthCard title="Create your ORVX account" subtitle="Join a club and start training.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <TextField
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          autoComplete="name"
        />
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
          autoComplete="new-password"
        />
        <SelectField
          label="I am a"
          name="role"
          value={form.role}
          onChange={handleChange}
          options={ROLE_OPTIONS}
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link className="font-medium text-emerald-600 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
