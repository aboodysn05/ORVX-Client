// The training-session lifecycle (build -> active -> completed -> submitted)
// now lives entirely on the backend — see src/api/sessions.js. `timeAgo` is
// the one piece of this file still used for display formatting.

export function timeAgo(iso) {
  if (!iso) return ''
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [label, size] of units) {
    const value = Math.floor(seconds / size)
    if (value >= 1) return `${value} ${label}${value === 1 ? '' : 's'} ago`
  }
  return 'just now'
}
