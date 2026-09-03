// Canonical attribute metadata shared across the player-facing screens.
// Keys match what the assessment stores in profile.attributes
// (see usePlayerAssessment). Order here is the *dashboard* display order
// (also the radar-axis order), which differs from the assessment's card order.

const OUTFIELD_ATTRS = [
  { key: 'pace', code: 'PAC', name: 'Pace' },
  { key: 'dribbling', code: 'DRI', name: 'Dribbling' },
  { key: 'shooting', code: 'SHO', name: 'Shooting' },
  { key: 'passing', code: 'PAS', name: 'Passing' },
  { key: 'defending', code: 'DEF', name: 'Defending' },
  { key: 'physical', code: 'PHY', name: 'Physical' },
]

const GK_ATTRS = [
  { key: 'reflexes', code: 'REF', name: 'Reflexes' },
  { key: 'handling', code: 'HAN', name: 'Handling' },
  { key: 'diving', code: 'DIV', name: 'Diving' },
  { key: 'positioning', code: 'POS', name: 'Positioning' },
  { key: 'kicking', code: 'KIC', name: 'Kicking' },
  { key: 'speed', code: 'SPD', name: 'Speed' },
]

// Fallback attribute values when a player has no stored assessment yet — the
// same demo figures the design canvas ships with.
const DEMO_OUTFIELD = { pace: 88, dribbling: 85, shooting: 82, passing: 79, defending: 62, physical: 78 }
const DEMO_GK = { reflexes: 86, handling: 84, diving: 81, positioning: 79, kicking: 72, speed: 68 }

export const POSITION_CODE = { Attacker: 'ATT', Defender: 'DEF', Goalkeeper: 'GK' }

// Which two attributes each of the three baseline sessions awards XP toward.
const XP_PAIRS_OUTFIELD = [
  ['PAC', 'DRI'],
  ['SHO', 'PAS'],
  ['PHY', 'DEF'],
]
const XP_PAIRS_GK = [
  ['REF', 'DIV'],
  ['HAN', 'POS'],
  ['KIC', 'SPD'],
]

// Unit vectors for the six radar axes (pointy-top hexagon), starting at the top
// and going clockwise. The SVG grid, data polygon and axis labels are all
// derived from this centre/radius so they stay aligned; the viewBox leaves
// room around the radius for the labels (see AttributesPanel).
export const RADAR_AXES = [
  [0, -1],
  [0.866, -0.5],
  [0.866, 0.5],
  [0, 1],
  [-0.866, 0.5],
  [-0.866, -0.5],
]
export const RADAR_CENTER = { x: 150, y: 150 }
export const RADAR_RADIUS = 108
// Distance from the outer ring to the axis-label anchor points.
export const RADAR_LABEL_GAP = 26

export function isGoalkeeper(position) {
  return position === 'Goalkeeper'
}

export function attrsFor(position) {
  return isGoalkeeper(position) ? GK_ATTRS : OUTFIELD_ATTRS
}

export function xpPairsFor(position) {
  return isGoalkeeper(position) ? XP_PAIRS_GK : XP_PAIRS_OUTFIELD
}

export function demoValuesFor(position) {
  return isGoalkeeper(position) ? { ...DEMO_GK } : { ...DEMO_OUTFIELD }
}
