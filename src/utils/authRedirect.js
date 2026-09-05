// Where a signed-in user lands, by role. Coaches go to their gateway (which
// itself forwards to the workspace once approved), admins to the console,
// everyone else to the player dashboard.
export function destForRole(role) {
  if (role === 'coach') return '/coach/gateway'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}
