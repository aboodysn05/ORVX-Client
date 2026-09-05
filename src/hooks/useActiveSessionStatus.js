import { useCallback, useEffect, useState } from 'react'
import { discardSession, getActiveSession } from '../api/sessions'

// Read-only view of the player's in-flight session plus a discard action.
// Used by the Session Builder to warn before a new session overwrites one
// that is still running or waiting on proof. The backend is the real source
// of truth for "is there a session in flight" (see the partial unique index
// on training_sessions) — this hook just mirrors it into React state.
export function useActiveSessionStatus() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    getActiveSession()
      .then(setSession)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const discard = useCallback(async () => {
    if (!session) return
    await discardSession(session.id)
    setSession(null)
  }, [session])

  return {
    session,
    status: session?.status || null, // 'active' | 'completed' | null
    hasUnfinished: Boolean(session),
    loading,
    discard,
  }
}
