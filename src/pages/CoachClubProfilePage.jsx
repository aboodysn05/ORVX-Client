import { Link } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { useAuth } from '../hooks/useAuth'
import { readCoachApplication } from '../utils/coachApplication'
import '../styles/coach-club.css'

// Coach Club Profile — translated from the design canvas
// (OVRX Club Profile.dc.html). Frontend only: read-only overview built from
// mock club data, personalised with the coach's name and requested club.

const STATS = [
  { k: 'Record', v: '8-2-1', tone: 'plain', note: 'Won · Drawn · Lost' },
  { k: 'Squad Size', v: '12 / 16', tone: 'plain', note: '4 places open' },
  { k: 'Average OVR', v: '79', tone: 'amber', note: '2nd highest in Division A' },
  { k: 'Goals', v: '34 : 12', tone: 'plain', note: 'Scored · Conceded' },
  { k: 'Verified Sessions', v: '146', tone: 'green', note: 'Approved this season' },
]

const FORM = [
  { result: 'W', score: '4 – 1', opponent: 'Ironline', tone: 'w' },
  { result: 'W', score: '3 – 0', opponent: 'Halcyon', tone: 'w' },
  { result: 'D', score: '2 – 2', opponent: 'Meridian', tone: 'd' },
]

const COMPOSITION = [
  { label: 'Attackers', count: 5, avg: 78, tone: 'pink' },
  { label: 'Defenders', count: 5, avg: 80, tone: 'indigo' },
  { label: 'Goalkeepers', count: 2, avg: 79, tone: 'amber' },
]
const COMPOSITION_TOTAL = 12

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
    note: 'Division A table, results and upcoming matchdays.',
    to: '/leagues',
  },
]

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF2E63" strokeWidth="2.4">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  )
}

export function CoachClubProfilePage() {
  const { user } = useAuth()
  const application = readCoachApplication(user?.email)
  const clubName = application?.clubName || 'Apex Academy FC'
  const headCoach = user?.name || 'Coach Marcus'
  const crest = clubName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const details = [
    { k: 'Founded', v: '2021' },
    { k: 'Home Ground', v: 'Apex Dome, Court 3' },
    { k: 'Format', v: '5v5 · Indoor' },
    { k: 'Division', v: 'A · Platform Slot 01' },
    { k: 'Club Contact', v: user?.email || 'marcus@apexacademy.fc' },
    { k: 'Squad Capacity', v: `${application?.capacity || 16} players` },
  ]

  return (
    <PageShell>
      <section className="ccp-section">
        <div className="ccp-header">
          <div className="ccp-header__main">
            <span className="ccp-crest">{crest}</span>
            <div className="ccp-header__id">
              <span className="ccp-kicker">Official Platform Club · Slot 01</span>
              <h1 className="ccp-title">{clubName}</h1>
              <div className="ccp-badges">
                <span className="ccp-badge ccp-badge--indigo">Head Coach · {headCoach}</span>
                <span className="ccp-badge ccp-badge--green">Verified</span>
                <span className="ccp-badge ccp-badge--amber">Division A</span>
              </div>
            </div>
          </div>
          <div className="ccp-header__pos">
            <span className="ccp-pos-label">League Position</span>
            <span className="ccp-pos-value">
              2<span className="ccp-pos-suffix">nd</span>
            </span>
            <span className="ccp-pos-note">3 points off top spot</span>
          </div>
        </div>

        <div className="ccp-stats">
          {STATS.map((s) => (
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
              <span className="ccp-card__hint">Last 3 matches · newest first</span>
            </div>
            <div className="ccp-form">
              {FORM.map((f, i) => (
                <span key={i} className={`ccp-form__cell is-${f.tone}`}>
                  <span className="ccp-form__result">{f.result}</span>
                  <span className="ccp-form__score">{f.score}</span>
                  <span className="ccp-form__opp">{f.opponent}</span>
                </span>
              ))}
            </div>
            <div className="ccp-nextfix">
              <span className="ccp-nextfix__label">Next Fixture</span>
              <span className="ccp-nextfix__opp">vs Vortex FC</span>
              <span className="ccp-nextfix__meta">Sat 05 Sep · 14:00 · Home</span>
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
            {COMPOSITION.map((c) => (
              <div key={c.label} className="ccp-comp">
                <div className="ccp-comp__row">
                  <span className={`ccp-comp__label is-${c.tone}`}>{c.label}</span>
                  <span className="ccp-comp__nums">
                    <span className="ccp-comp__avg">Avg OVR {c.avg}</span>
                    <span className="ccp-comp__count">{c.count}</span>
                  </span>
                </div>
                <span className="ccp-comp__bar">
                  <span
                    className={`ccp-comp__fill is-${c.tone}`}
                    style={{ width: `${Math.round((c.count / COMPOSITION_TOTAL) * 100)}%` }}
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
