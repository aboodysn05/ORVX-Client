import { useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import '../styles/leagues.css'

const TABS = [
  { key: 'LEAGUE', label: 'League Table' },
  { key: 'KNOCKOUT', label: 'Knockout Bracket' },
  { key: 'FIXTURES', label: 'Fixtures & Results' },
]

const STANDINGS = [
  { pos: 1, club: 'Northgate FC', p: 12, w: 9, d: 2, l: 1, gf: 31, ga: 9, pts: 29, form: ['W', 'W', 'W', 'D', 'W'] },
  { pos: 2, club: 'Riverside United', p: 12, w: 8, d: 3, l: 1, gf: 26, ga: 12, pts: 27, form: ['W', 'D', 'W', 'W', 'L'] },
  { pos: 3, club: 'Eastside Rangers', p: 12, w: 7, d: 2, l: 3, gf: 22, ga: 15, pts: 23, form: ['L', 'W', 'W', 'D', 'W'] },
  { pos: 4, club: 'Harbour Athletic', p: 12, w: 6, d: 3, l: 3, gf: 19, ga: 16, pts: 21, form: ['D', 'W', 'L', 'W', 'D'] },
  { pos: 5, club: 'Kingsway Town', p: 12, w: 4, d: 4, l: 4, gf: 15, ga: 17, pts: 16, form: ['L', 'D', 'W', 'L', 'D'] },
  { pos: 6, club: 'Meadow Park FC', p: 12, w: 3, d: 3, l: 6, gf: 13, ga: 22, pts: 12, form: ['L', 'L', 'D', 'W', 'L'] },
  { pos: 7, club: 'Central Wanderers', p: 12, w: 2, d: 3, l: 7, gf: 11, ga: 25, pts: 9, form: ['L', 'L', 'W', 'L', 'D'] },
  { pos: 8, club: 'Lakeside Rovers', p: 12, w: 1, d: 3, l: 8, gf: 8, ga: 30, pts: 6, form: ['L', 'D', 'L', 'L', 'L'] },
]

const BRACKET = [
  {
    round: 'Quarter-Finals',
    ties: [
      { home: 'Northgate FC', away: 'Lakeside Rovers', leg1: '3–0', leg2: '2–1', agg: '5–1', through: 'Northgate FC' },
      { home: 'Harbour Athletic', away: 'Eastside Rangers', leg1: '1–1', leg2: '0–2', agg: '1–3', through: 'Eastside Rangers' },
      { home: 'Riverside United', away: 'Central Wanderers', leg1: '2–0', leg2: '1–1', agg: '3–1', through: 'Riverside United' },
      { home: 'Kingsway Town', away: 'Meadow Park FC', leg1: '0–0', leg2: '1–2', agg: '1–2', through: 'Meadow Park FC' },
    ],
  },
  {
    round: 'Semi-Finals',
    ties: [
      { home: 'Northgate FC', away: 'Meadow Park FC', leg1: '2–1', leg2: '—', agg: 'Leg 2 · Sat 20:00', through: null },
      { home: 'Eastside Rangers', away: 'Riverside United', leg1: '1–1', leg2: '—', agg: 'Leg 2 · Sat 20:00', through: null },
    ],
  },
  {
    round: 'Final',
    ties: [{ home: 'TBD', away: 'TBD', leg1: '—', leg2: '—', agg: 'Neutral venue · Jun 14', through: null }],
  },
]

const FIXTURES = [
  { date: 'Sat 06 Sep', time: '15:00', home: 'Northgate FC', away: 'Kingsway Town', score: '4–1', status: 'FT' },
  { date: 'Sat 06 Sep', time: '15:00', home: 'Riverside United', away: 'Meadow Park FC', score: '2–0', status: 'FT' },
  { date: 'Sun 07 Sep', time: '13:30', home: 'Eastside Rangers', away: 'Lakeside Rovers', score: '3–1', status: 'FT' },
  { date: 'Sun 07 Sep', time: '16:00', home: 'Harbour Athletic', away: 'Central Wanderers', score: '1–1', status: 'FT' },
  { date: 'Sat 13 Sep', time: '15:00', home: 'Kingsway Town', away: 'Riverside United', score: 'vs', status: 'UPCOMING' },
  { date: 'Sat 13 Sep', time: '15:00', home: 'Meadow Park FC', away: 'Eastside Rangers', score: 'vs', status: 'UPCOMING' },
  { date: 'Sun 14 Sep', time: '13:30', home: 'Lakeside Rovers', away: 'Harbour Athletic', score: 'vs', status: 'UPCOMING' },
  { date: 'Sun 14 Sep', time: '16:00', home: 'Central Wanderers', away: 'Northgate FC', score: 'vs', status: 'UPCOMING' },
]

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

export function LeaguesPage() {
  const [tab, setTab] = useState('LEAGUE')

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
            <strong>8</strong> Clubs
          </span>
          <span className="lg-meta__item">
            <strong>Matchday 13</strong> of 14
          </span>
          <span className="lg-meta__item">
            <strong>Season</strong> 2025/26
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

      {tab === 'LEAGUE' && (
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
                {STANDINGS.map((row) => (
                  <tr key={row.club} className={row.pos <= 4 ? 'is-qualify' : ''}>
                    <td className="lg-table__pos">{row.pos}</td>
                    <td className="lg-table__club">{row.club}</td>
                    <td>{row.p}</td>
                    <td>{row.w}</td>
                    <td>{row.d}</td>
                    <td>{row.l}</td>
                    <td className="lg-table__hide">{row.gf}</td>
                    <td className="lg-table__hide">{row.ga}</td>
                    <td>{row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}</td>
                    <td className="lg-table__pts">{row.pts}</td>
                    <td className="lg-table__form">
                      <FormDots form={row.form} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lg-legend">
            <span className="lg-legend__key" /> Top 4 qualify for the knockout cup.
          </p>
        </section>
      )}

      {tab === 'KNOCKOUT' && (
        <section className="lg-block">
          <div className="lg-bracket">
            {BRACKET.map((col) => (
              <div key={col.round} className="lg-bracket__col">
                <span className="lg-bracket__round">{col.round}</span>
                {col.ties.map((tie, i) => (
                  <article key={i} className="lg-tie pg-card">
                    <div className={`lg-tie__row ${tie.through === tie.home ? 'is-through' : ''}`}>
                      <span>{tie.home}</span>
                      <span className="lg-tie__legs">{tie.leg1}</span>
                    </div>
                    <div className={`lg-tie__row ${tie.through === tie.away ? 'is-through' : ''}`}>
                      <span>{tie.away}</span>
                      <span className="lg-tie__legs">{tie.leg2}</span>
                    </div>
                    <div className="lg-tie__agg">{tie.through ? `Agg ${tie.agg}` : tie.agg}</div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'FIXTURES' && (
        <section className="lg-block">
          <div className="lg-fixtures">
            {FIXTURES.map((f, i) => (
              <article key={i} className="lg-fixture pg-card">
                <div className="lg-fixture__when">
                  <span className="lg-fixture__date">{f.date}</span>
                  <span className="lg-fixture__time">{f.time}</span>
                </div>
                <div className="lg-fixture__teams">
                  <span className="lg-fixture__team is-home">{f.home}</span>
                  <span
                    className={`lg-fixture__score ${f.status === 'FT' ? 'is-ft' : 'is-upcoming'}`}
                  >
                    {f.score}
                  </span>
                  <span className="lg-fixture__team is-away">{f.away}</span>
                </div>
                <span className={`lg-fixture__status is-${f.status.toLowerCase()}`}>
                  {f.status === 'FT' ? 'Full time' : 'Upcoming'}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
