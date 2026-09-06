import { useEffect, useState } from 'react'
import { getMyCoachApplication } from '../api/coaches'
import { useAuth } from './useAuth'

// The signed-in coach's club-management application.
//
// Stale-while-revalidate: the last result is cached at module scope so the nav
// and the gateway paint instantly without a spinner, but every mount ALSO
// re-fetches, so a status change made elsewhere (e.g. an admin approving the
// coach in another session) is always picked up. The cache is keyed by user id
// so one coach's application never bleeds into the next account.

let cache // undefined = never loaded; null = no application; object = the application
let cachedUserId
let inflight = null

function load(userId) {
  if (!inflight) {
    inflight = getMyCoachApplication()
      .then((a) => {
        cache = a ?? null
        cachedUserId = userId
        return cache
      })
      .catch(() => {
        cache = null
        cachedUserId = userId
        return null
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

function reset() {
  cache = undefined
  cachedUserId = undefined
  inflight = null
}

export function refreshCoachApplication() {
  const pinnedUser = cachedUserId
  reset()
  return load(pinnedUser)
}

export function useCoachApplication() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const seeded = cache !== undefined && cachedUserId === userId ? cache : null
  const [application, setApplication] = useState(seeded)
  // Always start a mount as "revalidating" so route guards wait for a fresh
  // answer rather than acting on a stale cached status.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    if (userId == null) {
      reset()
      setApplication(null)
      setLoading(false)
      return () => {
        alive = false
      }
    }

    // Cache belongs to a different user (account switch / fresh registration).
    if (cache !== undefined && cachedUserId !== userId) reset()

    // Paint the cached value immediately (no flicker), then revalidate.
    if (cache !== undefined && cachedUserId === userId) setApplication(cache)
    setLoading(true)

    load(userId).then((a) => {
      if (!alive) return
      setApplication(a)
      setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [userId])

  return { application, loading }
}
