import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteNav } from '../components/layout/SiteNav'
import { SiteFooter } from '../components/layout/SiteFooter'
import { DailyQuote } from '../components/DailyQuote'
import { listDrills } from '../api/drills'
import { listClubs } from '../api/clubs'
import { listCompetitions, getStandings } from '../api/competitions'
import { getFeaturedPlayer } from '../api/players'
import { cardName, initials } from '../utils/playerCard'
import { attrsFor } from '../utils/attributes'
import heroShot from '../assets/hero.jpg'
import '../styles/home.css'

const FEATURES = [
  {
    title: 'Coach-Verified Drills',
    body: 'Record a drill, submit the clip, and a licensed coach reviews it. Nothing moves your rating without a human signing off.',
  },
  {
    title: 'Attribute Engine',
    body: 'Six tracks, FIFA-style. Approved sessions push the numbers up; missed blocks let them drift back down.',
  },
  {
    title: 'Clubs & Rosters',
    body: 'Join a local side or run one. Coaches build drill blocks, manage the roster, and see who is match-fit this week.',
  },
  {
    title: 'Leagues & Knockouts',
    body: 'Organized fixtures with live tables, aggregate ties and brackets. Results feed straight back into player form.',
  },
]

const CHECKLIST = [
  'Session history with the clip, the coach, and the delta applied.',
  'Position-aware weighting — a keeper is not graded like a winger.',
  'A shareable profile link scouts and club coaches can open.',
]

const ATTRIBUTES = [
  { name: 'Pace', value: 88 },
  { name: 'Shooting', value: 79 },
  { name: 'Passing', value: 84 },
  { name: 'Dribbling', value: 86 },
  { name: 'Defending', value: 62 },
  { name: 'Physical', value: 77 },
]

const STEPS = [
  {
    n: '01',
    title: 'Record the block',
    body: "Pick a drill from your coach's assigned block, film the set on a phone, and upload it with your reps and timings.",
  },
  {
    n: '02',
    title: 'Coach reviews it',
    body: 'A verified coach scores technique, approves or returns the submission, and leaves a note on what to fix next time.',
  },
  {
    n: '03',
    title: 'Attributes move',
    body: "Approved work updates your card, your club's depth chart, and your standing in the league's player rankings.",
  },
]

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function HeroPage() {
  const [drillCount, setDrillCount] = useState(null)
  const [clubCount, setClubCount] = useState(null)
  const [topStandings, setTopStandings] = useState([])
  const [leagueName, setLeagueName] = useState('')
  const [featuredPlayer, setFeaturedPlayer] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [drills, clubs, competitions, player] = await Promise.all([
        listDrills(),
        listClubs(),
        listCompetitions(),
        getFeaturedPlayer(),
      ])
      if (cancelled) return
      setDrillCount(drills.length)
      setClubCount(clubs.length)
      setFeaturedPlayer(player)

      const league = competitions.find((c) => c.type === 'league')
      if (league) {
        const standings = await getStandings(league.id)
        if (cancelled) return
        setLeagueName(league.name)
        setTopStandings(standings.slice(0, 4))
      }
    }

    load().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Falls back to the illustrative demo card when no player has completed
  // the assessment yet (a real, if currently unlikely, empty state).
  const attrDefs = attrsFor(featuredPlayer?.position || 'Attacker')
  const card = featuredPlayer
    ? {
        avatar: initials(featuredPlayer.name),
        name: cardName(featuredPlayer.name),
        subtitle: featuredPlayer.position,
        overall: featuredPlayer.overall,
        attrs: attrDefs.map((def) => ({ name: def.name, value: featuredPlayer.attributes[def.key] })),
        footLeft: 'Self-assessed baseline',
        footRight: `${featuredPlayer.tier} Tier`,
      }
    : {
        avatar: 'ME',
        name: 'Mousa Eriqat',
        subtitle: 'Right Winger · Northgate FC',
        overall: 84,
        attrs: ATTRIBUTES,
        footLeft: 'Last approved · 2m ago',
        footRight: '+2 this week',
      }

  const stats = [
    { value: drillCount === null ? '—' : `${drillCount}`, label: 'Drills Available' },
    { value: clubCount === null ? '—' : `${clubCount}`, label: 'Clubs' },
    { value: '6', label: 'Attribute Tracks' },
  ]

  return (
    <div className="home">
      <div className="home__grid" />
      <div className="home__glow-a" />
      <div className="home__glow-b" />
      <div className="home__dots" />

      <SiteNav />

      <main className="home__main">
      {/* Hero */}
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF2E63" stroke="none">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
            </svg>
            Next-Gen Football Development Platform
          </span>

          <DailyQuote />

          <p className="hero__lead">
            Train with coach-verified drills, track your FIFA-style attributes,
            join elite local clubs, and rise through organized league &amp;
            knockout competitions.
          </p>

          <div className="hero__actions">
            <Link to="/register" className="btn btn--primary">
              Get Started Free
              <ArrowIcon />
            </Link>
            <a href="#platform" className="btn btn--ghost">
              Explore Competitions
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h12v5a6 6 0 0 1-12 0V4zM9 20h6M12 15v5" />
              </svg>
            </a>
          </div>
        </div>

        <div className="hero__media">
          <div className="hero__media-glow" />
          <div className="hero__frame">
            <div className="hero__frame-bar hero__frame-bar--top">
              <span className="hero__frame-tag">
                <span className="dot" />
                Drill Capture
              </span>
              <span className="hero__frame-meta">Cam 02 · Frame 214</span>
            </div>

            <div className="hero__shot">
              <img
                className="hero__shot-img"
                src={heroShot}
                alt="Player running an agility-ladder drill under stadium lights"
              />
              <div className="hero__shot-scrim" />

              <div className="hero__pill hero__pill--approved">
                <span className="hero__pill-check">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22E07E" strokeWidth="3">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                </span>
                <span className="hero__pill-text">
                  <span className="hero__pill-title">+2 Speed Drill Approved</span>
                  <span className="hero__pill-sub">Coach verified · 2m ago</span>
                </span>
              </div>

              <div className="hero__pill hero__pill--live">
                <span className="hero__pill-live-label">
                  <span className="dot dot--sm" />
                  Live
                </span>
                <span className="hero__pill-title">OVRX Champions League</span>
                <span className="hero__pill-sub hero__pill-sub--muted">Semi-Final · Agg 3-2</span>
              </div>
            </div>

            <div className="hero__frame-bar hero__frame-bar--bottom">
              <span className="hero__frame-meta">Cone Weave · Right Foot</span>
              <span className="hero__frame-meta hero__frame-meta--indigo">6 Attributes Tracked</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stats__item">
            <span className="stats__value">{stat.value}</span>
            <span className="stats__label">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Platform */}
      <section className="platform" id="platform">
        <div className="section-head">
          <span className="eyebrow">The Platform</span>
          <h2 className="section-title">Four systems, one player record.</h2>
          <p className="section-lead">
            Training, verification, clubs and competition all write to the same
            profile. What you do on the pitch is what shows up on your card.
          </p>
        </div>

        <div className="platform__grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF2E63" strokeWidth="2">
                <path d="M4 5h16v14H4z" />
                <path d="M8 9h8M8 13h5" />
              </svg>
              <h3 className="feature__title">{feature.title}</h3>
              <p className="feature__body">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Attribute tracks + player card */}
      <section className="tracks">
        <div className="tracks__copy">
          <span className="eyebrow">Attribute Tracks</span>
          <h2 className="section-title">Your rating is earned, never entered.</h2>
          <p className="section-lead">
            Every point on the card traces back to a timestamped session and the
            coach who approved it. Tap any attribute to see the drills behind it.
          </p>
          <ul className="tracks__list">
            {CHECKLIST.map((item) => (
              <li key={item}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3">
                  <path d="M4 12l5 5L20 6" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__id">
              <span className="card__avatar">{card.avatar}</span>
              <span className="card__name">
                <strong>{card.name}</strong>
                <span>{card.subtitle}</span>
              </span>
            </div>
            <span className="card__ovr">
              <span className="card__ovr-label">OVR</span>
              <span className="card__ovr-value">{card.overall}</span>
            </span>
          </div>

          <div className="card__attrs">
            {card.attrs.map((attr) => (
              <div key={attr.name} className="attr">
                <div className="attr__row">
                  <span className="attr__name">{attr.name}</span>
                  <span className="attr__value">{attr.value}</span>
                </div>
                <span className="attr__bar">
                  <span className="attr__fill" style={{ width: `${attr.value}%` }} />
                </span>
              </div>
            ))}
          </div>

          <div className="card__foot">
            <span>{card.footLeft}</span>
            <span>{card.footRight}</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how">
        <div className="section-head">
          <span className="eyebrow">How It Works</span>
          <h2 className="section-title">Train. Verify. Rise.</h2>
        </div>

        <div className="how__grid">
          {STEPS.map((step) => (
            <div key={step.n} className="step">
              <span className="step__n">{step.n}</span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__body">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Competitions */}
      <section className="comp">
        <div className="comp__copy">
          <span className="eyebrow">Competitions</span>
          <h2 className="section-title">Organized football, not pickup football.</h2>
          <p className="section-lead">
            OVRX runs the season for you: fixture generation, live tables,
            two-legged knockouts and automatic aggregate scoring. Clubs apply,
            get seeded, and play.
          </p>
          <div className="comp__tags">
            <span className="tag">League Phase</span>
            <span className="tag">Knockout Bracket</span>
            <span className="tag">Aggregate Ties</span>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card__head">
            <strong>{leagueName || 'Premier Development League'} · Top 4</strong>
            <span>Live standings</span>
          </div>
          <table className="standings">
            <thead>
              <tr>
                <th>Club</th>
                <th>P</th>
                <th>W</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {topStandings.map((row) => (
                <tr key={row.club} className={row.position === 1 ? 'is-lead' : ''}>
                  <td>{row.club}</td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                  <td>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audience */}
      <section className="audience">
        <div className="audience__card">
          <span className="audience__kicker">For Players</span>
          <h3>Build a record scouts can read</h3>
          <p>
            Submit drills, watch six attributes move, join a club, and play a
            real season. Free while you are on a club roster.
          </p>
          <Link to="/register" className="audience__link audience__link--primary">
            Create Player Profile
            <ArrowIcon />
          </Link>
        </div>
        <div className="audience__card">
          <span className="audience__kicker audience__kicker--indigo">For Coaches</span>
          <h3>Run the roster from one screen</h3>
          <p>
            Build drill blocks, review video submissions in a queue, approve or
            return with notes, and track squad form across the season.
          </p>
          <Link to="/register" className="audience__link audience__link--ghost">
            Claim Your Club
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div>
          <h2 className="cta__title">
            Real sweat.<br />Real stats.
          </h2>
          <p className="cta__text">
            Start free, get your first drill approved this week, and take your
            card into the next season.
          </p>
        </div>
        <Link to="/register" className="cta__btn">
          Get Started Free
          <ArrowIcon />
        </Link>
      </section>
      </main>

      <SiteFooter />
    </div>
  )
}
