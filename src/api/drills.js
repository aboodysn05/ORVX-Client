import client from './client'
import { codeForKey } from '../utils/attributes'

// The backend keys a drill's `boosts` by the same lowercase attribute names
// the assessment uses (pace, dribbling, ...). The session builder's internal
// logic (useSessionBuilder.js) is built around the short uppercase display
// codes (PAC, DRI, ...) instead. Rather than rewrite that logic, translate at
// the API boundary using the shared key -> code map in utils/attributes.js.
function toBuilderShape(drill) {
  const boosts = {}
  for (const [key, value] of Object.entries(drill.boosts)) {
    boosts[codeForKey(key)] = value
  }
  return {
    id: drill.id,
    name: drill.name,
    boosts,
    sets: drill.sets,
    reps: drill.reps,
    unitKind: drill.unitKind,
    perSet: drill.secondsPerSet,
  }
}

export function listDrills() {
  return client.get('/drills').then((res) => res.data.drills.map(toBuilderShape))
}
