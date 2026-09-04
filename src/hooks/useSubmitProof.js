import { useEffect, useMemo, useState } from 'react'
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

// One approved baseline session unlocks the Club Head Coach picker. Matches the
// dashboard's eligibility gate (usePlayerDashboard TOTAL_SESSIONS).
const BASELINE_TARGET = 1

// Accepted upload types and the hard length cap from the drill rules.
const VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const MAX_CLIP_SECONDS = 90

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

function clock(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Read a video file's duration without adding it to the page. Resolves NaN if
// the browser can't decode the metadata (or takes too long).
function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const probe = document.createElement('video')
    const done = (value) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = setTimeout(() => done(NaN), 4000)
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      clearTimeout(timer)
      done(probe.duration)
    }
    probe.onerror = () => {
      clearTimeout(timer)
      done(NaN)
    }
    probe.src = url
  })
}

// All state and derived copy for the Submit Training Proof page. Reviewer
// routing (locked Platform Evaluator vs. open Club Coach picker) and every
// summary line follow whether the player's baseline session is approved.
export function useSubmitProof() {
  const { user } = useAuth()
  const session = useMemo(() => loadSession(), [])

  const [approved, setApprovedState] = useState(() =>
    Math.min(BASELINE_TARGET, readApprovedSessions(user?.email)),
  )
  const [coach, setCoach] = useState(CLUB_COACHES[0])
  const [notes, setNotes] = useState('')
  const [tipOpen, setTipOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  // Attached clip: { name, size, url, duration }. The object URL feeds the
  // in-page <video> preview and is revoked whenever the clip changes / unmounts.
  const [clip, setClip] = useState(null)
  const [clipError, setClipError] = useState('')

  useEffect(() => {
    if (!clip?.url) return undefined
    return () => URL.revokeObjectURL(clip.url)
  }, [clip])

  const baselineDone = approved >= BASELINE_TARGET
  const reviewerName = baselineDone ? coach.split(' · ')[0] : 'Coach #9'
  const hasClip = Boolean(clip)
  const clipDurationLabel = clip && Number.isFinite(clip.duration) ? clock(clip.duration) : ''

  const drillLine = session.drills
    .map((d) => `${d.sets}×${d.reps}${d.unit === 'Secs' ? 's' : ''}`)
    .join(' · ')

  function setApproved(n) {
    const clamped = Math.max(0, Math.min(BASELINE_TARGET, n))
    writeApprovedSessions(user?.email, clamped)
    setApprovedState(clamped)
  }

  async function onPickFile(file) {
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type) && !file.type.startsWith('video/')) {
      setClipError('That file isn’t a video. Upload an MP4 or MOV.')
      return
    }
    const duration = await readDuration(file)
    if (Number.isFinite(duration) && duration > MAX_CLIP_SECONDS + 2) {
      setClipError(`Clip runs ${clock(duration)} — trim it to ${MAX_CLIP_SECONDS} seconds or less.`)
      return
    }
    setClipError('')
    setClip({ name: file.name, size: file.size, url: URL.createObjectURL(file), duration })
  }

  function clearClip() {
    setClip(null)
    setClipError('')
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
      : 'This is your baseline session — Platform Coach #9 reviews it. Once it’s approved, you choose your own club coach.',

    sessionLine: `${session.name} · ${session.drills.length} ${
      session.drills.length === 1 ? 'drill' : 'drills'
    }`,

    // video clip
    hasClip,
    clipUrl: clip?.url || '',
    clipName: clip?.name || '',
    clipDurationLabel,
    clipError,
    acceptTypes: '.mp4,.mov,video/mp4,video/quicktime',
    onPickFile,
    clearClip,

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
    canSubmit: hasClip,
    submit: () => {
      if (!hasClip) {
        setClipError('Attach a training clip before submitting.')
        return
      }
      setSuccessOpen(true)
    },
    submitNote: !hasClip
      ? 'Attach a training clip to submit.'
      : baselineDone
        ? 'Reviewed by your chosen club coach.'
        : 'Routed automatically to the Platform Evaluator while your baseline is pending.',

    // side column
    summary: [
      { k: 'Session', v: session.name, color: '#fff' },
      { k: 'Drills', v: drillLine, color: '#fff' },
      {
        k: 'Clip',
        v: hasClip
          ? `${clipDurationLabel ? `${clipDurationLabel} · ` : ''}${formatSize(clip.size)} attached`
          : 'No clip attached',
        color: hasClip ? '#22E07E' : '#5A6784',
      },
      {
        k: 'Notes',
        v: notes ? `${notes.slice(0, 26)}${notes.length > 26 ? '…' : ''}` : 'None added',
        color: notes ? '#fff' : '#5A6784',
      },
      { k: 'Reviewer', v: reviewerName, color: baselineDone ? '#22E07E' : '#F59E0B' },
      { k: 'Projected XP', v: (session.rewards || []).join(' · ') || '+4 XP', color: '#F59E0B' },
    ],
    routingNote: baselineDone
      ? 'Your baseline session is approved, so the reviewer field is open. Club coaches see your verified attributes alongside each clip.'
      : 'One approved baseline session unlocks the reviewer field — then you can route clips to any of the 8 Club Head Coaches.',

    // success modal
    successOpen,
    closeSuccess: () => setSuccessOpen(false),
    successTitle: baselineDone ? 'Session sent to your club coach' : 'Session sent to Coach #9',
    successBody: baselineDone
      ? `${reviewerName} has your clip in their review queue. Approved sessions add verified XP to your attributes.`
      : 'Your clip is in the Platform Evaluator queue. Expect a verdict within 24 hours — approval adds verified XP and completes your baseline so you can pick a club coach.',
  }
}
