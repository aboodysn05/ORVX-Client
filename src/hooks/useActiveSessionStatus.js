import { useCallback, useReducer } from 'react'
import { useAuth } from './useAuth'
import { discardActiveSession, readActiveSession } from '../utils/trainingSession'

// Read-only view of the player's in-flight session plus a discard action.
// Used by the Session Builder to warn before a new session overwrites one that
// is still running or waiting on proof.
export function useActiveSessionStatus() {
  const { user } = useAuth()
  const [, refresh] = useReducer((n) => n + 1, 0)

  // Cheap localStorage read; re-runs on render and after a discard.
  const session = readActiveSession(user?.email)

  const discard = useCallback(() => {
    discardActiveSession(user?.email)
    refresh()
  }, [user?.email])

  return {
    session,
    status: session?.status || null, // 'active' | 'completed' | null
    hasUnfinished: Boolean(session),
    discard,
  }
}
