import { useEffect, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { listClubs } from '../api/clubs'
import {
  listCompetitions,
  getStandings,
  getFixtures,
  getBracket,
  getTopScorers,
} from '../api/competitions'
import '../styles/leagues.css'

const TABS = [
  { key: 'LEAGUE', label: 'League Table' },
  { key: 'SCORERS', label: 'Top Scorers' },
  { key: 'KNOCKOUT', label: 'Cup Bracket' },
  { key: 'FIXTURES', label: 'Fixtures & Results' },
]


function matchdayNumber(roundLabel) {
  return Number((roundLabel || '').match(/\d+/)?.[0]) || 0
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

function FormDots({ form }) {
  return (
    <span className="lg-form">
      {form.map((r, i) => (
        <span key={i} className={`lg-form__dot is-${r.toLowerCase()}`}>
          {r}
        </span>
      ))}
    </span>
  )
}

// A competition's scoring chart, built from the goals recorded on its results.
function ScorerTable({ title, rows }) {
  return (
    <div className="lg-scorers pg-card">
      <h2 className="lg-scorers__title">{title}</h2>
      {rows.length === 0 ? (
        <p className="lg-scorers__empty">No goals recorded yet.</p>
      ) : (
        <div className="lg-tablewrap">
          <table className="lg-table">
            <thead>
              <tr>
                <th className="lg-table__pos">#</th>
                <th className="lg-table__club">Player</th>
                <th className="lg-table__club">Club</th>
                <th className="lg-table__hide">Matches</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.playerId}-${r.clubId}`}>
                  <td className="lg-table__pos">{r.rank}</td>
                  <td className="lg-table__club">{r.name}</td>
                  <td className="lg-table__club">{r.club}</td>
                  <td className="lg-table__hide">{r.matches}</td>
                  <td className="lg-table__pts">{r.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function LeaguesPage() {
  const [tab, setTab] = useState('LEAGUE')
  const [loading, setLoading] = useState(true)
  const [clubCount, setClubCount] = useState(0)
  const [season, setSeason] = useState('')
  const [standings, setStandings] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [bracketRounds, setBracketRounds] = useState([])
  const [leagueScorers, setLeagueScorers] = useState([])
  const [cupScorers, setCupScorers] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [clubs, competitions] = await Promise.all([listClubs(), listCompetitions()])
      const league = competitions.find((c) => c.type === 'league')
      const knockout = competitions.find((c) => c.type === 'knockout')

      const [standingsData, fixturesData, bracketData, leagueGoals, cupGoals] = await Promise.all([
        league ? getStandings(league.id) : [],
        league ? getFixtures(league.id) : [],
        knockout ? getBracket(knockout.id) : [],
        league ? getTopScorers(league.id) : [],
        knockout ? getTopScorers(knockout.id) : [],
      ])

      if (cancelled) return
      setClubCount(clubs.length)
      setSeason(league?.season || '')
      setStandings(standingsData)
      setFixtures(fixturesData)
      setBracketRounds(bracketData)
      setLeagueScorers(leagueGoals)
      setCupScorers(cupGoals)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // "Matchday X of Y" — X is how many matchdays are fully played, Y is how
  // many exist at all. Both derived from the real fixtures list, not stored.
  const matchdayAllPlayed = fixtures.reduce((acc, f) => {
    const n = matchdayNumber(f.round)
    acc[n] = (acc[n] ?? true) && f.status === 'played'
    return acc
  }, {})
  const totalMatchdays = Math.max(0, ...Object.keys(matchdayAllPlayed).map(Number))
  const playedMatchdays = Object.values(matchdayAllPlayed).filter(Boolean).length

  return (
    <PageShell>
      <section className="lg-head">
        <span className="pg-eyebrow">Competitions Hub</span>
        <h1 className="pg-title">Premier Development League</h1>
        <p className="pg-lead">
          Admin-run round-robin season plus a two-legged knockout cup. Standings and aggregate
          scores update automatically as coaches confirm results.
        </p>

        <div className="lg-meta">
          <span className="lg-meta__item">
            <strong>{clubCount}</strong> Clubs
          </span>
          <span className="lg-meta__item">
            <strong>Matchday {playedMatchdays}</strong> of {totalMatchdays}
          </span>
          <span className="lg-meta__item">
            <strong>Season</strong> {season}
          </span>
        </div>

        <div className="lg-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`lg-tab ${t.key === tab ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="pg-lead">Loading league data…</p>}

      {!loading && tab === 'LEAGUE' && (
        <section className="lg-block">
          <div className="lg-tablewrap pg-card">
            <table className="lg-table">
              <thead>
                <tr>
                  <th className="lg-table__pos">#</th>
                  <th className="lg-table__club">Club</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th className="lg-table__hide">GF</th>
                  <th className="lg-table__hide">GA</th>
                  <th>GD</th>
                  <th>Pts</th>
                  <th className="lg-table__form">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.club} className={row.position <= 4 ? 'is-qualify' : ''}>
                    <td className="lg-table__pos">{row.position}</td>
                    <td className="lg-table__club">{row.club}</td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td className="lg-table__hide">{row.goalsFor}</td>
                    <td className="lg-table__hide">{row.goalsAgainst}</td>
                    <td>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                    <td className="lg-table__pts">{row.points}</td>
                    <td className="lg-table__form">
                      <FormDots form={row.form} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lg-legend">
            Every club is in the table from the opening whistle — rows fill in as results land.
          </p>
          <p className="lg-legend">
            <span className="lg-legend__key" /> Top 4 qualify for the knockout cup.
          </p>
        </section>
      )}

      {!loading && tab === 'SCORERS' && (
        <section className="lg-block">
          <ScorerTable title="League Golden Boot" rows={leagueScorers} />
          <ScorerTable title="Cup Top Scorers" rows={cupScorers} />
        </section>
      )}

      {!loading && tab === 'KNOCKOUT' && (
        <section className="lg-block">
          {bracketRounds.length === 0 && (
            <p className="pg-lead">The cup bracket appears once the tournament fixtures are set.</p>
          )}
          <div className="lg-bracket">
            {bracketRounds.map((col) => (
              <div key={col.round} className="lg-bracket__col">
                <span className="lg-bracket__round">{col.round}</span>
                {col.ties.map((tie, i) => (
                  <article key={i} className="lg-tie pg-card">
                    <div className={`lg-tie__row ${tie.through === tie.home ? 'is-through' : ''}`}>
                      <span>{tie.home}</span>
                      <span className="lg-tie__legs">{tie.leg1 || '—'}</span>
                    </div>
                    <div className={`lg-tie__row ${tie.through === tie.away ? 'is-through' : ''}`}>
                      <span>{tie.away}</span>
                      <span className="lg-tie__legs">{tie.leg2 || '—'}</span>
                    </div>
                    <div className="lg-tie__agg">
                      {tie.through ? `Agg ${tie.agg}` : tie.pending ? tie.agg || 'Awaiting Leg 2' : tie.agg}
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && tab === 'FIXTURES' && (
        <section className="lg-block">
          {fixtures.length === 0 && (
            <p className="pg-lead">No fixtures scheduled yet.</p>
          )}
          <div className="lg-fixtures">
            {fixtures.map((f) => (
              <article key={f.id} className="lg-fixture pg-card">
                <div className="lg-fixture__when">
                  <span className="lg-fixture__date">{formatDate(f.scheduledAt)}</span>
                  <span className="lg-fixture__time">{formatTime(f.scheduledAt)}</span>
                </div>
                <div className="lg-fixture__teams">
                  <span className="lg-fixture__team is-home">{f.home}</span>
                  <span
                    className={`lg-fixture__score ${f.status === 'played' ? 'is-ft' : 'is-upcoming'}`}
                  >
                    {f.status === 'played' ? `${f.homeScore}–${f.awayScore}` : 'vs'}
                  </span>
                  <span className="lg-fixture__team is-away">{f.away}</span>
                </div>
                <span className={`lg-fixture__status is-${f.status === 'played' ? 'ft' : 'upcoming'}`}>
                  {f.status === 'played' ? 'Full time' : 'Upcoming'}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
