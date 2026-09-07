import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { useAuth } from '../hooks/useAuth'
import { useCoachApplication } from '../hooks/useCoachApplication'
import { listClubs, getClubOverview } from '../api/clubs'
import '../styles/coach-club.css'

// Coach Club Profile — live from GET /clubs/:id/overview. Resolves the coach's
// club the same way the Squad Manager does (match on head-coach name, then the
// approved application's club name), then renders the real standings row,
// roster composition, verified-session count, recent form and next fixture.

const ACTIONS = [
  {
    title: 'Roster & Applications',
    note: 'Sign free agents, update positions, manage the 16-place squad.',
    to: '/coach/squad',
  },
  {
    title: 'Drill Proof Review',
    note: "Approve your squad's training submissions and credit attribute XP.",
    to: '/coach/review',
  },
  {
    title: 'League & Fixtures',
    note: 'Division table, results and upcoming matchdays.',
    to: '/leagues',
  },
]

const COMP_TONE = { Attacker: 'pink', Defender: 'indigo', Goalkeeper: 'amber' }

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF2E63" strokeWidth="2.4">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  )
}

function ordinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function fixtureWhen(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} · ${time}`
}

export function CoachClubProfilePage() {
  const { user } = useAuth()
  const { application } = useCoachApplication()

  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    listClubs()
      .then((clubs) => {
        const mine =
          clubs.find((c) => c.headCoachName && c.headCoachName === user?.name) ||
          clubs.find((c) => application?.clubName && c.name === application.clubName)
        if (!mine) throw new Error('We could not find a club linked to your account yet.')
        return getClubOverview(mine.id)
      })
      .then((data) => {
        if (alive) {
          setOverview(data)
          setError('')
        }
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.message || err.message || 'Could not load your club.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [user, application])

  if (loading) {
    return (
      <PageShell>
        <section className="ccp-section">
          <p className="ccp-kicker">Loading your club…</p>
        </section>
      </PageShell>
    )
  }

  if (error || !overview) {
    return (
      <PageShell>
        <section className="ccp-section">
          <h1 className="ccp-title">Club Profile</h1>
          <p className="ccp-stat__note">{error || 'No club data available.'}</p>
        </section>
      </PageShell>
    )
  }

  const o = overview
  const league = o.league
  const headCoach = o.headCoachName || user?.name || 'Head Coach'
  const crest = o.crestCode || o.name.slice(0, 3).toUpperCase()

  const record = league ? `${league.won}-${league.drawn}-${league.lost}` : '—'
  const goals = league ? `${league.goalsFor} : ${league.goalsAgainst}` : '—'

  const stats = [
    { k: 'Record', v: record, tone: 'plain', note: 'Won · Drawn · Lost' },
    {
      k: 'Squad Size',
      v: `${o.rosterCount} / ${o.squadCap}`,
      tone: 'plain',
      note: o.placesOpen ? `${o.placesOpen} place${o.placesOpen === 1 ? '' : 's'} open` : 'Squad full',
    },
    {
      k: 'Average OVR',
      v: o.averageOverall || '—',
      tone: 'amber',
      note: o.rosterCount ? 'Across the active roster' : 'No players signed yet',
    },
    { k: 'Goals', v: goals, tone: 'plain', note: 'Scored · Conceded' },
    {
      k: 'Verified Sessions',
      v: o.verifiedSessions,
      tone: 'green',
      note: 'Approved training proofs',
    },
  ]

  const details = [
    { k: 'Founded', v: String(o.foundedYear) },
    { k: 'Format', v: o.format },
    { k: 'Division', v: o.division || '—' },
    { k: 'Platform Slot', v: o.slot ? `Slot ${String(o.slot).padStart(2, '0')}` : '—' },
    { k: 'Club Contact', v: o.headCoachEmail || user?.email || '—' },
    { k: 'Squad Capacity', v: `${o.squadCap} players` },
  ]

  const compositionTotal = o.composition.reduce((sum, c) => sum + c.count, 0) || 1

  return (
    <PageShell>
      <section className="ccp-section">
        <div className="ccp-header">
          <div className="ccp-header__main">
            <span className="ccp-crest">{crest}</span>
            <div className="ccp-header__id">
              <span className="ccp-kicker">
                {o.slot ? `Official Platform Club · Slot ${String(o.slot).padStart(2, '0')}` : 'Platform Club'}
              </span>
              <h1 className="ccp-title">{o.name}</h1>
              <div className="ccp-badges">
                <span className="ccp-badge ccp-badge--indigo">Head Coach · {headCoach}</span>
                <span className="ccp-badge ccp-badge--green">{o.archived ? 'Archived' : 'Verified'}</span>
                {o.division && <span className="ccp-badge ccp-badge--amber">{o.division}</span>}
              </div>
            </div>
          </div>
          {league && (
            <div className="ccp-header__pos">
              <span className="ccp-pos-label">League Position</span>
              <span className="ccp-pos-value">
                {league.position}
                <span className="ccp-pos-suffix">{ordinalSuffix(league.position)}</span>
              </span>
              <span className="ccp-pos-note">
                {league.points} pts · {league.played} played
              </span>
            </div>
          )}
        </div>

        <div className="ccp-stats">
          {stats.map((s) => (
            <div key={s.k} className="ccp-stat">
              <span className="ccp-stat__k">{s.k}</span>
              <span className={`ccp-stat__v is-${s.tone}`}>{s.v}</span>
              <span className="ccp-stat__note">{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ccp-body">
        <div className="ccp-col ccp-col--main">
          <div className="ccp-card">
            <div className="ccp-card__head">
              <h2 className="ccp-card__title">Season Form</h2>
              <span className="ccp-card__hint">Most recent results · newest first</span>
            </div>
            {o.recentResults.length === 0 ? (
              <p className="ccp-stat__note">No results recorded yet.</p>
            ) : (
              <div className="ccp-form">
                {o.recentResults.slice(0, 3).map((f) => (
                  <span
                    key={f.matchId}
                    className={`ccp-form__cell is-${f.result === 'W' ? 'w' : f.result === 'L' ? 'l' : 'd'}`}
                  >
                    <span className="ccp-form__result">{f.result}</span>
                    <span className="ccp-form__score">
                      {f.goalsFor} – {f.goalsAgainst}
                    </span>
                    <span className="ccp-form__opp">{f.opponent}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="ccp-nextfix">
              <span className="ccp-nextfix__label">Next Fixture</span>
              {o.nextFixture ? (
                <>
                  <span className="ccp-nextfix__opp">
                    {o.nextFixture.home ? 'vs' : 'at'} {o.nextFixture.opponent}
                  </span>
                  <span className="ccp-nextfix__meta">
                    {fixtureWhen(o.nextFixture.scheduledAt)} · {o.nextFixture.home ? 'Home' : 'Away'}
                    {o.nextFixture.round ? ` · ${o.nextFixture.round}` : ''}
                  </span>
                </>
              ) : (
                <span className="ccp-nextfix__meta">No fixture scheduled.</span>
              )}
              <Link to="/leagues" className="ccp-nextfix__link">
                League Table →
              </Link>
            </div>
          </div>

          <div className="ccp-card">
            <div className="ccp-card__head">
              <h2 className="ccp-card__title">Squad Composition</h2>
              <Link to="/coach/squad" className="ccp-card__link">
                Manage Roster →
              </Link>
            </div>
            {o.composition.map((c) => (
              <div key={c.position} className="ccp-comp">
                <div className="ccp-comp__row">
                  <span className={`ccp-comp__label is-${COMP_TONE[c.position]}`}>{c.position}s</span>
                  <span className="ccp-comp__nums">
                    <span className="ccp-comp__avg">Avg OVR {c.averageOverall || '—'}</span>
                    <span className="ccp-comp__count">{c.count}</span>
                  </span>
                </div>
                <span className="ccp-comp__bar">
                  <span
                    className={`ccp-comp__fill is-${COMP_TONE[c.position]}`}
                    style={{ width: `${Math.round((c.count / compositionTotal) * 100)}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ccp-col ccp-col--side">
          <div className="ccp-card">
            <h2 className="ccp-card__title">Club Details</h2>
            {details.map((d) => (
              <div key={d.k} className="ccp-detail">
                <span className="ccp-detail__k">{d.k}</span>
                <span className="ccp-detail__v">{d.v}</span>
              </div>
            ))}
          </div>

          <div className="ccp-card">
            <h2 className="ccp-card__title">Club Management</h2>
            {ACTIONS.map((a) => (
              <Link key={a.title} to={a.to} className="ccp-action">
                <span className="ccp-action__text">
                  <span className="ccp-action__title">{a.title}</span>
                  <span className="ccp-action__note">{a.note}</span>
                </span>
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
