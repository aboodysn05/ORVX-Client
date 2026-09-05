import client from './client'
import { codeForKey } from '../utils/attributes'

// Training-session lifecycle: build -> tick sets -> complete -> submit.
// Each function is a thin wrapper around one endpoint in
// backend/src/routes/sessions.routes.js.
//
// The backend's session shape (rewards/boosts as { pace: 2, ... } objects,
// unitKind as 'reps'/'secs') doesn't match what the existing hooks/pages
// already expect (rewards as ['+2 PAC', ...] strings, a pre-joined `boost`
// string per drill, 'Reps'/'Secs' capitalized). toUiSession() is the one
// place that translation happens, same adapter pattern as api/drills.js.

function boostString(boosts) {
  return Object.entries(boosts)
    .map(([key, value]) => `+${value} ${codeForKey(key)}`)
    .join(' · ')
}

function toUiSession(session) {
  if (!session) return null
  return {
    id: session.id,
    name: session.name,
    focus: session.focus,
    status: session.status,
    totalTime: session.totalTime,
    rewards: Object.entries(session.rewards).map(([key, value]) => `+${value} ${codeForKey(key)}`),
    videoUrl: session.videoUrl,
    notes: session.notes,
    reviewerName: session.reviewerName,
    reviewStatus: session.reviewStatus,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    submittedAt: session.submittedAt,
    drills: session.drills.map((drill) => ({
      id: drill.id,
      drillId: drill.drillId,
      name: drill.name,
      boost: boostString(drill.boosts),
      sets: drill.sets,
      reps: drill.reps,
      unit: drill.unitKind === 'secs' ? 'Secs' : 'Reps',
      progress: drill.progress,
    })),
  }
}

export function createSession({ name, focus, drills }) {
  return client.post('/sessions', { name, focus, drills }).then((res) => toUiSession(res.data.session))
}

// Resolves to null (not a rejection) when there's no session in flight —
// callers treat "no active session" as normal, expected state, not an error.
export function getActiveSession() {
  return client
    .get('/sessions/active')
    .then((res) => toUiSession(res.data.session))
    .catch((err) => {
      if (err.response?.status === 404) return null
      throw err
    })
}

export function saveProgress(sessionId, progress) {
  return client
    .patch(`/sessions/${sessionId}/progress`, { progress })
    .then((res) => toUiSession(res.data.session))
}

export function completeSession(sessionId) {
  return client.post(`/sessions/${sessionId}/complete`).then((res) => toUiSession(res.data.session))
}

export function discardSession(sessionId) {
  return client.delete(`/sessions/${sessionId}`)
}

export function submitSession(sessionId, { videoUrl, notes, reviewerName }) {
  return client
    .post(`/sessions/${sessionId}/submit`, { videoUrl, notes, reviewerName })
    .then((res) => toUiSession(res.data.session))
}

export function listSessions(status) {
  return client
    .get('/sessions', { params: status ? { status } : undefined })
    .then((res) => res.data.sessions.map(toUiSession))
}
