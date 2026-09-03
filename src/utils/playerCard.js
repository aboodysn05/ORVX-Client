// Display helpers for a player's name on cards and chips.

// "Jordan Adeyemi" -> "J. Adeyemi", "Ronaldo" -> "Ronaldo", "" -> "Your Name".
export function cardName(fullName) {
  if (!fullName) return 'Your Name'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`
}

// "Jordan Adeyemi" -> "JA", "Ronaldo" -> "RO", "" -> "OV".
export function initials(fullName) {
  if (!fullName) return 'OV'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Deterministic pseudo player ID ("OVRX-8842") derived from a stable string
// (email). Front-end placeholder until the backend assigns real IDs.
export function playerId(seed) {
  const source = seed || 'ovrx'
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return `OVRX-${(hash % 9000) + 1000}`
}
