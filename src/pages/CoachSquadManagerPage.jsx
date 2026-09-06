import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { useAuth } from '../hooks/useAuth'
import { useCoachApplication } from '../hooks/useCoachApplication'
import {
  listClubs,
  getRoster,
  getScoutingPool,
  listClubApplications,
  signPlayer,
  updateRosterPosition,
  releasePlayer,
  decideClubApplication,
} from '../api/clubs'
import '../styles/coach-squad.css'

// Coach Squad Manager — live from GET /clubs/:id/roster, /applications and
// /players/scouting-pool. Sign released free agents (cap 16), accept/decline
// club applications, change roster positions, release players.

const CAPACITY = 16
const POSITIONS = ['Attacker', 'Defender', 'Goalkeeper']
const POS_TONE = { Attacker: 'pink', Defender: 'indigo', Goalkeeper: 'amber' }
const COLUMNS = ['Player', 'Position', 'Baseline OVR', 'Source', 'Applied', 'Actions']

function initialsOf(name) {
  const p = (name || '').trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'
}
function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

export function CoachSquadManagerPage() {
  const { user } = useAuth()
  const { application } = useCoachApplication()

  const [club, setClub] = useState(null)
  const [roster, setRoster] = useState({ players: [], count: 0, squadCap: CAPACITY })
  const [applications, setApplications] = useState([])
  const [pool, setPool] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('roster')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  const fire = (t) => {
    setToast(t)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(null), 3200)
  }

  // Resolve which club this coach heads.
  useEffect(() => {
    listClubs()
      .then((clubs) => {
        const mine =
          clubs.find((c) => c.headCoachName && c.headCoachName === user?.name) ||
          clubs.find((c) => application?.clubName && c.name === application.clubName)
        setClub(mine || null)
        if (!mine) {
          setError('No club is linked to this coach account yet.')
          setLoading(false)
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load your club.')
        setLoading(false)
      })
  }, [user, application])

  const reload = useCallback(() => {
    if (!club) return
    setLoading(true)
    Promise.all([
      getRoster(club.id),
      listClubApplications(club.id).catch(() => []),
      getScoutingPool().catch(() => []),
    ])
      .then(([r, apps, p]) => {
        setRoster(r)
        setApplications(apps.filter((a) => a.status === 'pending'))
        setPool(p)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load the squad.'))
      .finally(() => setLoading(false))
  }, [club])

  useEffect(reload, [reload])

  const squadCount = roster.count
  const capacity = roster.squadCap || CAPACITY
  const full = squadCount >= capacity
  const pct = Math.round((squadCount / capacity) * 100)
  const capTone = full ? 'full' : pct >= 85 ? 'high' : 'ok'

  const crest = (club?.name || application?.clubName || 'Club')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  // The "pending" tab: club applications + released free agents not already applied.
  const appliedPlayerIds = new Set(applications.map((a) => a.playerId))
  const freeAgents = pool.filter((p) => !appliedPlayerIds.has(p.playerId))
  const pendingCount = applications.length + freeAgents.length

  async function run(fn, successToast) {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      fire(successToast)
      reload()
    } catch (err) {
      fire({ kind: 'declined', title: 'Action failed', body: err.response?.data?.message || 'Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const changePosition = (playerId, name, next) =>
    run(
      () => updateRosterPosition(club.id, playerId, next),
      { kind: 'position', title: 'Position updated', body: `${name} is now registered as ${next}.` },
    )

  const release = (playerId, name) =>
    run(
      () => releasePlayer(club.id, playerId),
      { kind: 'declined', title: 'Player released', body: `${name} is back in the scouting pool.` },
    )

  const signAgent = (playerId, name, position) =>
    run(
      () => signPlayer(club.id, { playerId, position }),
      { kind: 'accepted', title: 'Player signed', body: `${name} has joined ${club.name}. Their training queue now routes to you.` },
    )

  const acceptApp = (appId, name) =>
    run(
      () => decideClubApplication(club.id, appId, 'accept'),
      { kind: 'accepted', title: 'Application accepted', body: `${name} has joined ${club.name}.` },
    )

  const declineApp = (appId, name) =>
    run(
      () => decideClubApplication(club.id, appId, 'decline'),
      { kind: 'declined', title: 'Application declined', body: `${name} stays a free agent and can apply elsewhere.` },
    )

  const headerSub = useMemo(
    () => `Head Coach · ${club?.headCoachName || user?.name || 'Coach'}${club?.slot ? ` · Slot ${club.slot}` : ''}`,
    [club, user],
  )

  return (
    <PageShell>
      <section className="csm-section">
        <div className="csm-header">
          <div className="csm-header__id">
            <span className="csm-crest">{club?.crestCode || crest}</span>
            <div className="csm-header__text">
              <span className="csm-club">{club?.name || application?.clubName || 'Your Club'}</span>
              <span className="csm-sub">{headerSub}</span>
            </div>
          </div>
          <div className="csm-cap">
            <div className="csm-cap__row">
              <span className="csm-cap__label">Squad Capacity</span>
              <span className={`csm-cap__count is-${capTone}`}>
                {squadCount}
                <span className="csm-cap__count-sub"> / {capacity} Players</span>
              </span>
            </div>
            <span className="csm-cap__bar">
              <span className={`csm-cap__fill is-${capTone}`} style={{ width: `${pct}%` }} />
            </span>
            <span className="csm-cap__note">
              {full
                ? 'Squad full — release a player before signing'
                : `${capacity - squadCount} roster places open`}
            </span>
          </div>
        </div>

        <div className="csm-tabs">
          {[
            { key: 'roster', label: `Active Roster (${squadCount})` },
            { key: 'pending', label: `Applications & Free Agents (${pendingCount})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`csm-tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <section className="csm-panel">
          <div className="csm-empty">
            <span className="csm-empty__title">Couldn't load</span>
            <span className="csm-empty__note">{error}</span>
          </div>
        </section>
      )}

      {!error && tab === 'roster' && (
        <section className="csm-panel">
          <div className="csm-panel__head">
            <h2 className="csm-panel__title">Active Roster</h2>
            <span className="csm-panel__hint">Position changes apply immediately</span>
          </div>

          {loading && <div className="csm-empty"><span className="csm-empty__note">Loading roster…</span></div>}

          {!loading && roster.players.length === 0 && (
            <div className="csm-empty">
              <span className="csm-empty__title">Empty roster</span>
              <span className="csm-empty__note">Sign released free agents from the other tab.</span>
            </div>
          )}

          <div className="csm-roster">
            {!loading && roster.players.map((p) => {
              const pos = p.squadPosition || p.position
              return (
                <div key={p.playerId} className="csm-card">
                  <div className="csm-card__top">
                    <span className="csm-avatar">{initialsOf(p.name)}</span>
                    <span className="csm-card__id">
                      <span className="csm-card__name">{p.name}</span>
                      <span className={`csm-pos is-${POS_TONE[pos]}`}>{pos}</span>
                    </span>
                    <span className="csm-card__ovr">
                      <span className="csm-card__ovr-v">{p.overall}</span>
                      <span className="csm-card__ovr-l">OVR</span>
                    </span>
                  </div>

                  <div className="csm-card__metrics">
                    <span className="csm-metric">
                      <span className="csm-metric__k">Height</span>
                      <span className="csm-metric__v">{p.heightCm} cm</span>
                    </span>
                    <span className="csm-metric">
                      <span className="csm-metric__k">Weight</span>
                      <span className="csm-metric__v">{p.weightKg} kg</span>
                    </span>
                    <span className="csm-metric">
                      <span className="csm-metric__k">Tier</span>
                      <span className="csm-metric__v">{p.tier}</span>
                    </span>
                  </div>

                  <label className="csm-card__update">
                    <span className="csm-card__update-label">Update Position</span>
                    <select
                      className="csm-select"
                      value={pos}
                      disabled={busy}
                      onChange={(e) => changePosition(p.playerId, p.name, e.target.value)}
                    >
                      {POSITIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="csm-decline"
                    disabled={busy}
                    onClick={() => release(p.playerId, p.name)}
                  >
                    Release Player
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!error && tab === 'pending' && (
        <section className="csm-panel">
          <div className="csm-panel__head">
            <h2 className="csm-panel__title">Applications &amp; Free Agents</h2>
            <span className="csm-panel__hint">Everyone here has an approved baseline session</span>
          </div>

          {loading && <div className="csm-empty"><span className="csm-empty__note">Loading…</span></div>}

          {!loading && pendingCount === 0 && (
            <div className="csm-empty">
              <span className="csm-empty__title">No applications or free agents</span>
              <span className="csm-empty__note">
                Released players who apply to your club — or any free agent in the scouting pool — show up here.
              </span>
            </div>
          )}

          {!loading && pendingCount > 0 && (
            <div className="csm-table">
              <div className="csm-table__head">
                {COLUMNS.map((c) => (
                  <span key={c} className="csm-table__col">{c}</span>
                ))}
              </div>

              {applications.map((a) => (
                <div key={`app-${a.id}`} className="csm-table__row">
                  <span className="csm-table__player">
                    <span className="csm-avatar csm-avatar--sm">{initialsOf(a.playerName)}</span>
                    <span className="csm-table__player-id">
                      <span className="csm-table__player-name">{a.playerName}</span>
                      <span className="csm-table__player-phys">{a.tier}</span>
                    </span>
                  </span>
                  <span className={`csm-pos is-${POS_TONE[a.position]}`}>{a.position}</span>
                  <span className="csm-table__ovr">{a.overall}</span>
                  <span className="csm-table__proof">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    Applied to you
                  </span>
                  <span className="csm-table__date">{fmtDate(a.createdAt)}</span>
                  <span className="csm-table__actions">
                    <button type="button" className="csm-decline" disabled={busy} onClick={() => declineApp(a.id, a.playerName)}>
                      Decline
                    </button>
                    <button type="button" className="csm-accept" disabled={full || busy} onClick={() => acceptApp(a.id, a.playerName)}>
                      {full ? 'Squad Full' : 'Accept into Squad'}
                    </button>
                  </span>
                </div>
              ))}

              {freeAgents.map((p) => (
                <div key={`fa-${p.playerId}`} className="csm-table__row">
                  <span className="csm-table__player">
                    <span className="csm-avatar csm-avatar--sm">{initialsOf(p.name)}</span>
                    <span className="csm-table__player-id">
                      <span className="csm-table__player-name">{p.name}</span>
                      <span className="csm-table__player-phys">{p.heightCm} cm · {p.weightKg} kg</span>
                    </span>
                  </span>
                  <span className={`csm-pos is-${POS_TONE[p.position]}`}>{p.position}</span>
                  <span className="csm-table__ovr">{p.overall}</span>
                  <span className="csm-table__proof">Free agent</span>
                  <span className="csm-table__date">{fmtDate(p.releasedAt)}</span>
                  <span className="csm-table__actions">
                    <button
                      type="button"
                      className="csm-accept"
                      disabled={full || busy}
                      onClick={() => signAgent(p.playerId, p.name, p.position)}
                    >
                      {full ? 'Squad Full' : 'Sign Free Agent'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {toast && (
        <div className={`csm-toast is-${toast.kind}`}>
          <span className="csm-toast__icon">
            {toast.kind === 'declined' ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M4 12l5 5L20 6" />
              </svg>
            )}
          </span>
          <span className="csm-toast__text">
            <span className="csm-toast__title">{toast.title}</span>
            <span className="csm-toast__body">{toast.body}</span>
          </span>
          <button type="button" className="csm-toast__close" aria-label="Dismiss" onClick={() => setToast(null)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </PageShell>
  )
}
