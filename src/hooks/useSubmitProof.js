import { useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { readApprovedSessions, writeApprovedSessions } from '../utils/playerProfile'

// The eight Club Head Coaches a verified player can route a submission to.
// Static demo data — becomes GET /coaches once the backend exists.
const CLUB_COACHES = [
  'Coach Marcus · Apex Academy',
  'Coach Elena · Vortex FC',
  'Coach Rios · Cyber Strikers',
  'Coach Ade · Northgate Union',
  'Coach Haas · Vantage Athletic',
  'Coach Bello · Meridian FC',
  'Coach Novak · Ironline SC',
  'Coach Sadiq · Halcyon Rovers',
]

// Baseline sessions that must be approved before the reviewer field unlocks.
const BASELINE_TARGET = 3

// Demo session used when the player reaches this page without one stashed by
// the Session Builder — mirrors useActiveWorkout's fallback.
const FALLBACK_SESSION = {
  name: 'Tuesday High-Intensity Speed & Dribbling',
  rewards: ['+3 PAC', '+2 DRI'],
  drills: [{ name: 'Cone Slalom Agility Weave', boost: '+2 PAC', sets: 3, reps: 15, unit: 'Reps' }],
}

function loadSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem('orvx_session') || 'null')
    if (parsed && Array.isArray(parsed.drills) && parsed.drills.length) return parsed
  } catch {
    // fall through to the demo session
  }
  return FALLBACK_SESSION
}

// All state and derived copy for the Submit Training Proof page. The reviewer
// routing (locked Platform Evaluator vs. open Club Coach picker) and every
// summary line are driven by how many baseline sessions the player has
// approved.
export function useSubmitProof() {
  const { user } = useAuth()
  const session = useMemo(() => loadSession(), [])

  const [approved, setApprovedState] = useState(() => readApprovedSessions(user?.email))
  const [coach, setCoach] = useState(CLUB_COACHES[0])
  const [notes, setNotes] = useState('')
  const [tipOpen, setTipOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const baselineDone = approved >= BASELINE_TARGET
  const remaining = Math.max(0, BASELINE_TARGET - approved)
  const reviewerName = baselineDone ? coach.split(' · ')[0] : 'Coach #9'

  const drillLine = session.drills
    .map((d) => `${d.sets}×${d.reps}${d.unit === 'Secs' ? 's' : ''}`)
    .join(' · ')

  function setApproved(n) {
    const clamped = Math.max(0, Math.min(BASELINE_TARGET, n))
    writeApprovedSessions(user?.email, clamped)
    setApprovedState(clamped)
  }

  return {
    baselineDone,
    approvedSteps: Array.from({ length: BASELINE_TARGET + 1 }, (_, n) => ({
      value: n,
      label: `${n} / ${BASELINE_TARGET}`,
      active: n === approved,
      select: () => setApproved(n),
    })),

    headerNote: baselineDone
      ? 'Baseline verified. Pick the Club Head Coach who should review this session.'
      : `Session ${Math.min(approved + 1, BASELINE_TARGET)} of your ${BASELINE_TARGET} baseline sessions. The reviewer is set for you until the baseline is complete.`,

    sessionLine: `${session.name} · ${session.drills.length} ${
      session.drills.length === 1 ? 'drill' : 'drills'
    }`,

    // reviewer routing
    lockLabel: baselineDone ? 'Reviewer unlocked' : 'Auto-locked',
    coaches: CLUB_COACHES,
    coach,
    onSelectCoach: (event) => setCoach(event.target.value),
    tipOpen,
    tipOn: () => setTipOpen(true),
    tipOff: () => setTipOpen(false),
    tipToggle: () => setTipOpen((open) => !open),

    // notes
    notes,
    onNotesChange: (event) => setNotes(event.target.value),

    // submit
    submit: () => setSuccessOpen(true),
    submitNote: baselineDone
      ? 'Reviewed by your chosen club coach.'
      : 'Routed automatically to the Platform Evaluator while you are unassigned.',

    // side column
    summary: [
      { k: 'Session', v: session.name, color: '#fff' },
      { k: 'Drills', v: drillLine, color: '#fff' },
      { k: 'Clip', v: '00:47 attached', color: '#22E07E' },
      {
        k: 'Notes',
        v: notes ? `${notes.slice(0, 26)}${notes.length > 26 ? '…' : ''}` : 'None added',
        color: notes ? '#fff' : '#5A6784',
      },
      { k: 'Reviewer', v: reviewerName, color: baselineDone ? '#22E07E' : '#F59E0B' },
      { k: 'Projected XP', v: (session.rewards || []).join(' · ') || '+4 XP', color: '#F59E0B' },
    ],
    routingNote: baselineDone
      ? 'Your 3 baseline sessions are approved, so the reviewer field is open. Club coaches see your verified attributes alongside each clip.'
      : `${remaining} more approval${remaining === 1 ? '' : 's'} and the reviewer field opens to all 8 Club Head Coaches.`,

    // success modal
    successOpen,
    closeSuccess: () => setSuccessOpen(false),
    successTitle: baselineDone ? 'Session sent to your club coach' : 'Session sent to Coach #9',
    successBody: baselineDone
      ? `${reviewerName} has your clip in their review queue. Approved sessions add verified XP to your attributes.`
      : 'Your clip is in the Platform Evaluator queue. Expect a verdict within 24 hours — approved sessions add verified XP and count toward your 3-session baseline.',
  }
}
