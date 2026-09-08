import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { getActiveSession, submitSession } from '../api/sessions'
import { getMyProfile } from '../api/players'

// There's no real video upload/storage backend yet (see
// backend/src/services/sessions.service.js's submitSession — it stores
// whatever URL string it's given). The drag-and-drop clip below is kept
// purely for the in-page preview/UX; this fixed placeholder is what actually
// gets sent as videoUrl so POST /sessions/:id/submit can be exercised
// end-to-end. Swap this for a real upload once file storage exists.
const PLACEHOLDER_VIDEO_URL = 'https://example.com/placeholder-clip.mp4'

// One approved baseline session releases the player to the scouting pool.
// Matches the dashboard's eligibility gate (usePlayerDashboard TOTAL_SESSIONS).
const BASELINE_TARGET = 1

// Accepted upload types and the hard length cap from the drill rules.
const VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const MAX_CLIP_SECONDS = 90

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

function drillLineOf(session) {
  return (session.drills || [])
    .map((d) => `${d.sets}×${d.reps}${d.unit === 'Secs' ? 's' : ''}`)
    .join(' · ')
}

// All state and derived copy for the Submit Training Proof page. The session
// under review is the completed workout from the lifecycle store — if there
// isn't one, the page redirects. On submit the session is archived into the
// dashboard's finished list.
export function useSubmitProof() {
  const { user } = useAuth()
  const email = user?.email

  // Captured once on mount so submitting (which moves the session out of
  // "in flight" on the backend) doesn't bounce the page out from under the
  // success modal.
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getActiveSession().then((data) => {
      if (!cancelled) {
        setSession(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const [profile, setProfile] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => setProfile(null))
  }, [])
  const [tipOpen, setTipOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Attached clip: { name, size, url, duration }. The object URL feeds the
  // in-page <video> preview and is revoked whenever the clip changes / unmounts.
  const [clip, setClip] = useState(null)
  const [clipError, setClipError] = useState('')

  useEffect(() => {
    if (!clip?.url) return undefined
    return () => URL.revokeObjectURL(clip.url)
  }, [clip])

  if (loading) {
    return { loading: true }
  }

  // Redirect targets when there is nothing valid to submit.
  const redirectTo = !session ? '/train' : session.status !== 'completed' ? '/workout' : null
  if (redirectTo) {
    return { redirectTo }
  }

  const approved = Math.min(BASELINE_TARGET, profile?.approvedSubmissions ?? 0)
  const baselineDone = Boolean(profile?.baselineApproved)
  // Routing mirrors the server: a club player is reviewed by their own head
  // coach, everyone else by the Platform Evaluator. The player has no say.
  const club = profile?.club || null
  const reviewerName = club ? `${club.name} head coach` : 'Platform Evaluator'
  const hasClip = Boolean(clip)
  const clipDurationLabel = clip && Number.isFinite(clip.duration) ? clock(clip.duration) : ''

  function setClipRejected(message) {
    setClipError(message)
  }

  async function onPickFile(file) {
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type) && !file.type.startsWith('video/')) {
      setClipRejected('That file isn’t a video. Upload an MP4 or MOV.')
      return
    }
    const duration = await readDuration(file)
    if (Number.isFinite(duration) && duration > MAX_CLIP_SECONDS + 2) {
      setClipRejected(`Clip runs ${clock(duration)} — trim it to ${MAX_CLIP_SECONDS} seconds or less.`)
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
    baselineLabel: baselineDone
      ? 'Baseline verified'
      : `Baseline ${approved} / ${BASELINE_TARGET} approved`,

    headerNote: baselineDone
      ? 'Baseline verified. Pick the Club Head Coach who should review this session.'
      : 'This is your baseline session — the Platform Evaluator reviews it. Once it’s approved, you choose your own club coach.',

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

    // reviewer routing — assigned, never chosen
    reviewer: {
      name: club ? club.name : 'Platform Evaluator',
      badge: club ? 'HC' : 'PE',
    },
    reviewerRole: club ? 'Your club head coach' : 'Official Platform Evaluator',
    tipOpen,
    tipOn: () => setTipOpen(true),
    tipOff: () => setTipOpen(false),
    tipToggle: () => setTipOpen((open) => !open),

    // notes
    notes,
    onNotesChange: (event) => setNotes(event.target.value),

    // submit
    canSubmit: hasClip && !submitting,
    submitError,
    submit: async () => {
      if (!hasClip) {
        setClipError('Attach a training clip before submitting.')
        return
      }
      setSubmitError('')
      setSubmitting(true)
      try {
        // Real file upload doesn't exist yet — see PLACEHOLDER_VIDEO_URL above.
        // The server decides the reviewer from the player's club — nothing
        // about routing is sent from here.
        await submitSession(session.id, { videoUrl: PLACEHOLDER_VIDEO_URL, notes })
        setSuccessOpen(true)
      } catch (err) {
        setSubmitError(err.response?.data?.message || 'Unable to submit this session. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    submitNote: !hasClip
      ? 'Attach a training clip to submit.'
      : club
        ? `Goes to your head coach at ${club.name}.`
        : 'Goes to the Platform Evaluator — you have no club yet.',

    // side column
    summary: [
      { k: 'Session', v: session.name, color: '#fff' },
      { k: 'Drills', v: drillLineOf(session), color: '#fff' },
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
      { k: 'Reviewer', v: reviewerName, color: club ? '#22E07E' : '#F59E0B' },
      {
        k: 'Projected XP',
        v: (session.rewards || []).join(' · ') || '+4 XP',
        color: '#F59E0B',
      },
    ],
    routingNote: club
      ? 'Signed players are reviewed by their own club\'s head coach. Nobody else can action your submissions.'
      : 'Players without a club are reviewed by the Platform Evaluator. Once a club signs you, their head coach takes over automatically.',

    // success modal
    successOpen,
    closeSuccess: () => setSuccessOpen(false),
    successTitle: club ? 'Session sent to your club coach' : 'Session sent to the Platform Evaluator',
    successBody: club
      ? `Your head coach at ${club.name} has the clip in their review queue. An approval adds the drills' attribute XP to your card.`
      : 'Your clip is in the Platform Evaluator queue. An approval adds the drills\' attribute XP and, if this is your baseline, releases you to the scouting pool.',
  }
}
