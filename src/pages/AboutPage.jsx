import { Link } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { ArrowIcon } from '../components/ui/ArrowIcon'
import '../styles/about.css'

const PILLARS = [
  {
    n: 'Pillar 01',
    title: 'The Player Experience',
    body: 'Track 6 core FIFA-style attributes (Pace, Shooting, Passing, Dribbling, Defending, Physical). Upload drill footage and watch attributes level up upon coach verification.',
  },
  {
    n: 'Pillar 02',
    title: 'The Coach Dashboard',
    body: 'Publish custom drills, review player video submissions in a dedicated approval queue, and manage team rosters with full oversight.',
  },
  {
    n: 'Pillar 03',
    title: 'Organized Competitions',
    body: 'Compete in admin-managed round-robin leagues and two-legged Champions League style knockout tournaments with automated standings and goal calculations.',
  },
]

const STEPS = [
  { n: '01', title: 'Train & Record', body: 'Player executes coach-published drills on the pitch.' },
  { n: '02', title: 'Verify & Level Up', body: 'Coach reviews video proof and awards attribute points.' },
  { n: '03', title: 'Compete & Rank', body: 'Players join clubs and participate in official league fixtures.', accent: true },
]

export function AboutPage() {
  return (
    <PageShell>
      <section className="about-hero">
        <span className="about-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF2E63">
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
          </svg>
          The Vision Behind OVRX
        </span>
        <h1 className="about-hero__title">
          Bridging local football with{' '}
          <span className="about-hero__accent">next-gen stat tracking</span>
        </h1>
        <p className="pg-lead">
          OVRX transforms real-world training into verified digital progress, giving
          grassroots players professional stat visibility and structured tournament play.
        </p>
      </section>

      <section className="about-block">
        <div className="about-block__head">
          <h2 className="about-h2">System Architecture</h2>
          <span className="pg-eyebrow">Three Pillars</span>
        </div>
        <div className="about-grid">
          {PILLARS.map((p) => (
            <article key={p.n} className="pillar pg-card">
              <span className="pillar__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF2E63" strokeWidth="2">
                  <path d="M12 3l8 3v6c0 5-3.4 8.1-8 9-4.6-.9-8-4-8-9V6l8-3z" />
                  <path d="M9 12h6M12 9v6" />
                </svg>
              </span>
              <span className="pillar__kicker">{p.n}</span>
              <h3 className="pillar__title">{p.title}</h3>
              <p className="pillar__body">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-block">
        <div className="about-block__head">
          <h2 className="about-h2">How It Works</h2>
          <span className="pg-eyebrow">Pitch to Profile</span>
        </div>
        <div className="about-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="about-step">
              <span className={`about-step__n ${s.accent ? 'is-accent' : ''}`}>{s.n}</span>
              <h3 className="pillar__title">{s.title}</h3>
              <p className="pillar__body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <h2 className="about-cta__title">Ready to turn your sweat into stats?</h2>
        <div className="about-cta__actions">
          <Link to="/register" className="about-cta__btn about-cta__btn--dark">
            Create Player Account
            <ArrowIcon />
          </Link>
          <Link to="/register" className="about-cta__btn about-cta__btn--outline">
            Register as Coach
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
