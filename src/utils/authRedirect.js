// Where a signed-in user lands after auth. Coaches go to their gateway (which
// itself forwards to the workspace once approved); the Platform Evaluator is a
// coach-role account but skips the gateway and lands on the Baseline Console.
// Admins go to the console, everyone else to the player dashboard.
export function destForUser(user) {
  const role = user?.role
  if (role === 'coach') {
    return user?.organization === 'Platform Evaluator' ? '/coach/evaluator' : '/coach/gateway'
  }
  if (role === 'admin') return '/admin'
  return '/dashboard'
}
