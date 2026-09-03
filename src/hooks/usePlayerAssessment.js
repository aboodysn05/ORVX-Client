import { useMemo, useState } from 'react'

// All of the player-assessment wizard logic lives here so the page and its
// child components stay presentational. The shape returned by this hook is the
// only contract the UI depends on; when the backend arrives, the persistence
// seam (`buildPayload`) becomes a POST to /players and nothing else changes.

export const POSITIONS = ['Attacker', 'Defender', 'Goalkeeper']
export const FEET = ['Left', 'Right', 'Both']

const POSITION_CODE = { Attacker: 'ATT', Defender: 'DEF', Goalkeeper: 'GK' }

// Outfield attribute set (used for Attacker / Defender).
const OUTFIELD_QUESTIONS = {
  pace: { code: 'PAC', label: 'Pace', question: 'How would you rate your sprint speed over 30 meters?' },
  shooting: { code: 'SHO', label: 'Shooting', question: 'Shooting power and finishing inside the box?' },
  passing: { code: 'PAS', label: 'Passing', question: 'Accuracy under pressure when passing short vs long?' },
  dribbling: { code: 'DRI', label: 'Dribbling', question: 'Comfort level with 1v1 dribbling and ball control?' },
  defending: { code: 'DEF', label: 'Defending', question: 'Defensive positioning and tackling strength?' },
  physical: { code: 'PHY', label: 'Physical', question: 'Stamina and physical strength during late-game minutes?' },
}

// Goalkeepers answer a different six.
const GK_QUESTIONS = {
  diving: { code: 'DIV', label: 'Diving', question: 'Range and reach when diving to either corner?' },
  handling: { code: 'HAN', label: 'Handling', question: 'Catching and holding crosses under contact?' },
  kicking: { code: 'KIC', label: 'Kicking', question: 'Distribution accuracy with throws, rolls and long kicks?' },
  reflexes: { code: 'REF', label: 'Reflexes', question: 'Reaction speed to close-range shots and deflections?' },
  speed: { code: 'SPD', label: 'Speed', question: 'Speed off your line when sweeping behind the defence?' },
  positioning: { code: 'POS', label: 'Positioning', question: 'Angles and starting position in 1v1 situations?' },
}

// Order the six stats appear in on the player card.
const OUTFIELD_ORDER = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical']
const GK_ORDER = ['diving', 'handling', 'kicking', 'reflexes', 'speed', 'positioning']

// Which attributes are asked on which wizard step.
const OUTFIELD_STEP_SLIDERS = {
  2: ['pace', 'physical'],
  3: ['passing', 'dribbling', 'shooting', 'defending'],
}
const GK_STEP_SLIDERS = {
  2: ['reflexes', 'speed'],
  3: ['diving', 'handling', 'kicking', 'positioning'],
}

export const STEPS = [
  {
    num: '01',
    label: 'Position & Foot',
    kicker: 'Step 01 of 04',
    title: 'Where do you play?',
    blurb:
      'Pick the position you play most and the foot you trust under pressure. Position weighting changes how your overall is calculated.',
  },
  {
    num: '02',
    label: 'Physical & Pace',
    kicker: 'Step 02 of 04',
    title: 'Physical & pace',
    blurb:
      'Be honest — your first coach-verified drill will correct anything you overstate here.',
  },
  {
    num: '03',
    label: 'Skill & Technical',
    kicker: 'Step 03 of 04',
    title: 'Skill & technical',
    blurb:
      'Rate your ball work as it holds up in a competitive match, not in the warm-up.',
  },
  {
    num: '04',
    label: 'Card Initialization',
    kicker: 'Step 04 of 04',
    title: 'Initialize your card',
    blurb: 'Review your starting card. You can retake the assessment once per season.',
  },
]

// Goalkeeper wording for the two slider steps.
const GK_STEP_COPY = {
  2: {
    label: 'Reactions & Speed',
    title: 'Reactions & speed',
    blurb:
      'Shot-stopping instinct first — your first coach-verified session will correct anything you overstate here.',
  },
  3: {
    label: 'Goalkeeping Technique',
    title: 'Goalkeeping technique',
    blurb:
      'Rate your handling and distribution as they hold up in a competitive match, not in the warm-up.',
  },
}

const DEFAULT_OUTFIELD = { pace: 72, shooting: 66, passing: 68, dribbling: 71, defending: 54, physical: 65 }
const DEFAULT_GK = { diving: 70, handling: 68, kicking: 64, reflexes: 73, speed: 61, positioning: 69 }

const TOTAL_STEPS = STEPS.length

// Bronze / Silver / Gold thresholds on the computed overall.
export function tierFor(overall) {
  if (overall >= 75) return { name: 'Gold', color: '#F5C144' }
  if (overall >= 65) return { name: 'Silver', color: '#C9D4E5' }
  return { name: 'Bronze', color: '#D08A4F' }
}

function averageOverall(questions, values) {
  const keys = Object.keys(questions)
  return Math.round(keys.reduce((sum, key) => sum + values[key], 0) / keys.length)
}

export function usePlayerAssessment() {
  const [step, setStep] = useState(1)
  const [position, setPosition] = useState('Attacker')
  const [foot, setFoot] = useState('Right')
  const [height, setHeight] = useState(178)
  const [weight, setWeight] = useState(72)
  const [outfieldVals, setOutfieldVals] = useState(DEFAULT_OUTFIELD)
  const [gkVals, setGkVals] = useState(DEFAULT_GK)

  const isGoalkeeper = position === 'Goalkeeper'
  const questions = isGoalkeeper ? GK_QUESTIONS : OUTFIELD_QUESTIONS
  const values = isGoalkeeper ? gkVals : outfieldVals
  const setValues = isGoalkeeper ? setGkVals : setOutfieldVals
  const cardOrder = isGoalkeeper ? GK_ORDER : OUTFIELD_ORDER
  const stepSliders = isGoalkeeper ? GK_STEP_SLIDERS : OUTFIELD_STEP_SLIDERS

  const overall = useMemo(() => averageOverall(questions, values), [questions, values])
  const tier = tierFor(overall)

  const baseCopy = STEPS[step - 1]
  const stepCopy =
    isGoalkeeper && GK_STEP_COPY[step] ? { ...baseCopy, ...GK_STEP_COPY[step] } : baseCopy

  const steps = STEPS.map((entry, index) => {
    const position1Based = index + 1
    const gkCopy = isGoalkeeper && GK_STEP_COPY[position1Based]
    let status = 'upcoming'
    if (position1Based === step) status = 'active'
    else if (position1Based < step) status = 'done'
    return { num: entry.num, label: gkCopy ? gkCopy.label : entry.label, status }
  })

  const activeSliders = (stepSliders[step] || []).map((key) => ({
    key,
    code: questions[key].code,
    label: questions[key].label,
    question: questions[key].question,
    value: values[key],
    setValue: (next) => setValues((prev) => ({ ...prev, [key]: next })),
  }))

  const badges = cardOrder.map((key) => ({
    key,
    code: questions[key].code,
    label: questions[key].label,
    value: values[key],
  }))

  const physique = `${height} cm · ${weight} kg`
  const positionCode = POSITION_CODE[position]
  const footCode = foot === 'Both' ? 'L/R' : foot.charAt(0).toUpperCase()

  return {
    // progress
    step,
    totalSteps: TOTAL_STEPS,
    steps,
    stepCopy,
    isFirstStep: step === 1,
    isLastStep: step === TOTAL_STEPS,
    showNext: step < TOTAL_STEPS,
    goNext: () => setStep((current) => Math.min(TOTAL_STEPS, current + 1)),
    goBack: () => setStep((current) => Math.max(1, current - 1)),

    // step 1 fields
    position,
    setPosition,
    foot,
    setFoot,
    height,
    setHeight,
    weight,
    setWeight,

    // steps 2 & 3
    activeSliders,

    // derived / preview
    isGoalkeeper,
    overall,
    tier,
    physique,
    positionCode,
    footCode,
    badges,

    // persistence seam — swap for a POST to /players when the API exists
    buildPayload: () => ({
      position,
      dominantFoot: foot,
      heightCm: height,
      weightKg: weight,
      attributes: cardOrder.reduce((acc, key) => ({ ...acc, [key]: values[key] }), {}),
      overall,
      tier: tier.name,
    }),
  }
}
