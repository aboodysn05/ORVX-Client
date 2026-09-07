import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { useAuth } from '../hooks/useAuth'
import { getAdminOverview } from '../api/admin'
import { cardName, initials } from '../utils/playerCard'
import '../styles/admin-overview.css'

// Sys-Admin Overview — live from GET /admin/overview. The snapshot counters
// and season stats are derived counts; the activity feed is assembled from the
// timestamped rows the console already produces (coach approvals, club
// provisioning / archiving, recorded results) — there is no separate audit log.

const ACTION_COLOR = { Access: '#A5B0FF', Results: '#10B981', Catalogue: '#F59E0B', Session: '#6E7C96' }
const STATUS_TONE = { SUCCESS: 'green', PENDING: 'amber', REVERTED: 'pink' }

function fmtTs(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} ${time}`
}

export function AdminOverviewPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    getAdminOverview()
      .then((d) => {
        if (alive) {
          setData(d)
          setError('')
        }
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.message || 'Could not load the console overview.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const snap = data?.snapshot
  const season = data?.season

  const snapshotCards = snap
    ? [
        {
          label: 'Pending Coach Requests',
          value: snap.pendingCoachRequests,
          note: snap.pendingCoachRequests ? 'Awaiting your decision' : 'Queue clear',
          to: '/admin/requests',
          color: '#F59E0B',
          cta: 'Review queue',
        },
        {
          label: 'Clubs Near Capacity',
          value: snap.clubsNearCapacity,
          note: `${snap.clubsAtCapacity} already at the cap`,
          to: '/admin/clubs',
          color: '#FF2E63',
          cta: 'Manage clubs',
        },
        {
          label: 'Results Outstanding',
          value: snap.resultsOutstanding,
          note: snap.resultsOutstanding ? 'Scheduled matches unplayed' : 'All results in',
          to: '/admin/leagues',
          color: '#4F46E5',
          cta: 'Enter results',
        },
        {
          label: 'Active Drills',
          value: snap.activeDrills,
          note: `${snap.retiredDrills} retired`,
          to: '/admin/drills',
          color: '#10B981',
          cta: 'Open catalogue',
        },
      ]
    : []

  const seasonCells = season
    ? [
        { label: 'Coaches Approved', value: season.coachesApproved, note: 'All time' },
        { label: 'Clubs Provisioned', value: season.clubsProvisioned, note: `${season.clubsArchived} archived` },
        { label: 'Submissions Approved', value: season.submissionsApproved, note: `${season.playersRegistered} players registered` },
      ]
    : []

  const activity = data?.activity || []

  return (
    <AdminShell
      footerNote="OVRX Admin Console · Overview"
      footerRight="Activity is derived from console actions across the platform"
    >
      <section className="adm-section">
        <div className="aov-banner">
          <span className="aov-banner__avatar">{initials(user?.name) || 'AD'}</span>
          <div className="aov-banner__id">
            <span className="aov-banner__kicker">
              <span className="aov-banner__pulse" />
              Signed in · Root Access
            </span>
            <h1 className="aov-banner__name">{cardName(user?.name) || 'Admin'}</h1>
            <span className="aov-mono aov-banner__email">{user?.email || '—'}</span>
          </div>
          <div className="aov-banner__meta">
            <span className="aov-metacell">
              <span className="aov-metacell__k">Admin ID</span>
              <span className="aov-mono aov-metacell__v">Admin_{String(user?.id ?? '').padStart(2, '0')}</span>
            </span>
            <span className="aov-metacell">
              <span className="aov-metacell__k">Access Level</span>
              <span className="aov-mono aov-metacell__v">ROOT</span>
            </span>
          </div>
        </div>
        <p className="aov-welcome">
          Everything below is live across the console. Jump straight to whatever needs a decision, then
          check the activity trail at the bottom.
        </p>
        {error && <p className="aov-welcome" style={{ color: '#FF2E63' }}>{error}</p>}
      </section>

      <section className="adm-section">
        <div className="aov-sectionhead">
          <span className="aov-sectionhead__title">Needs Your Attention</span>
          <span className="aov-mono aov-sectionhead__meta">
            {loading ? 'loading…' : `${snapshotCards.length} areas`}
          </span>
        </div>
        <div className="aov-snap">
          {snapshotCards.map((s) => (
            <Link key={s.label} to={s.to} className="aov-snapcard" style={{ '--c': s.color }}>
              <span className="aov-snapcard__top">
                <span className="aov-snapcard__label">{s.label}</span>
                <svg
                  className="aov-snapcard__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M6 18L18 6M9 6h9v9" />
                </svg>
              </span>
              <span className="aov-snapcard__value">{s.value}</span>
              <span className="aov-mono aov-snapcard__note">{s.note}</span>
              <span className="aov-snapcard__cta">{s.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="adm-section">
        <div className="aov-sectionhead">
          <span className="aov-sectionhead__title">Platform To Date</span>
          <span className="aov-mono aov-sectionhead__meta">Cumulative</span>
        </div>
        <div className="aov-season">
          {seasonCells.map((s) => (
            <div key={s.label} className="aov-seasoncell">
              <span className="aov-seasoncell__v">{s.value}</span>
              <span className="aov-seasoncell__k">{s.label}</span>
              <span className="aov-mono aov-seasoncell__note">{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="adm-section aov-log-section">
        <div className="aov-log-head">
          <span className="aov-log-head__left">
            <span className="aov-log-head__title">Recent Activity</span>
            <span className="aov-log-head__badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <rect x="5" y="11" width="14" height="9" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Derived
            </span>
          </span>
        </div>

        <div className="aov-term">
          <div className="aov-term__bar">
            <span className="aov-mono aov-term__cmd">
              <span className="aov-term__prompt">ovrx@console:~$</span> tail -n 15 activity.log
            </span>
            <span className="aov-mono aov-term__meta">
              {loading ? 'loading…' : `${activity.length} lines · newest first`}
            </span>
          </div>
          <div className="aov-term__scroll">
            <div className="aov-term__grid aov-term__grid--head">
              <span>Timestamp</span>
              <span>Action</span>
              <span>Target</span>
              <span className="adm-th--right">Status</span>
            </div>
            <div className="aov-term__rows">
              {activity.map((r, i) => (
                <div key={i} className="aov-term__grid aov-term__row">
                  <span className="aov-mono aov-term__ts">{fmtTs(r.ts)}</span>
                  <span className="aov-mono aov-term__action" style={{ color: ACTION_COLOR[r.kind] }}>
                    {r.action}
                  </span>
                  <span className="aov-mono aov-term__target">{r.target}</span>
                  <span className="adm-tc--right">
                    <span className={`adm-pill adm-pill--${STATUS_TONE[r.status] || 'green'} aov-mono`}>
                      {r.status}
                    </span>
                  </span>
                </div>
              ))}
              {!loading && activity.length === 0 && (
                <div className="aov-term__grid aov-term__row">
                  <span className="aov-mono aov-term__target">No console activity recorded yet.</span>
                </div>
              )}
            </div>
          </div>
          <div className="aov-term__foot">
            <span>Assembled from coach approvals, club changes and recorded results</span>
            <span className="aov-term__ok">■ Live</span>
          </div>
        </div>
      </section>
    </AdminShell>
  )
}
