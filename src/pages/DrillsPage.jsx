import { useEffect, useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { ArrowIcon } from '../components/ui/ArrowIcon'
import '../styles/drills.css'

const CATS = [
  { key: 'ALL', label: 'All Drills' },
  { key: 'PAC', label: 'Pace (PAC)' },
  { key: 'DRI', label: 'Dribbling (DRI)' },
  { key: 'SHO', label: 'Shooting (SHO)' },
  { key: 'PAS', label: 'Passing (PAS)' },
  { key: 'DEF', label: 'Defending (DEF)' },
  { key: 'PHY', label: 'Physical (PHY)' },
]

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Elite']

const COACHES = [
  'Coach Marcus · Northgate FC',
  'Coach Elena · Northgate FC',
  'Coach Idris · Riverside United',
]

const DRILLS = [
  {
    id: 'd1', stat: 'DRI', reward: '+3 DRI', title: 'Cone Slalom Agility Weave', coach: 'Coach Marcus',
    level: 'Intermediate', focus: 'Agility & Feet', duration: '15 mins', completes: 342, rating: '4.8',
    setup: 'Eight cones, one metre apart, in a straight line. Ball at the first cone, phone on a tripod square to the run.',
    execution: 'Weave the full line using both feet, turn at the end and return. Six passes without touching a cone.',
    rule: 'The full run must stay in frame from first touch to final turn. Cuts void the submission.',
  },
  {
    id: 'd2', stat: 'PAC', reward: '+2 PAC', title: '30m Flying Sprint Repeats', coach: 'Coach Elena',
    level: 'Elite', focus: 'Acceleration', duration: '20 mins', completes: 511, rating: '4.9',
    setup: 'Mark 30 metres with cones on grass. Film from the side so both markers are visible.',
    execution: 'Six sprints from a rolling start, 90 seconds recovery between reps. Call out each split.',
    rule: 'Both cones and a visible timer must be in frame for every rep.',
  },
  {
    id: 'd3', stat: 'PAS', reward: '+2 PAS', title: 'Wall Pass Accuracy Ladder', coach: 'Coach Marcus',
    level: 'Beginner', focus: 'Short Passing', duration: '12 mins', completes: 288, rating: '4.6',
    setup: 'Chalk a 60cm target on a wall, stand at 8, 12 and 16 metres.',
    execution: 'Ten passes from each distance, alternating feet, first touch only.',
    rule: 'Target and player both in frame; the count is audible or on screen.',
  },
  {
    id: 'd4', stat: 'SHO', reward: '+3 SHO', title: 'Box Finishing Under Pressure', coach: 'Coach Idris',
    level: 'Intermediate', focus: 'Finishing', duration: '18 mins', completes: 402, rating: '4.7',
    setup: 'Goal, six balls spread across the edge of the box, one server.',
    execution: 'One-touch finishes from each position, alternating near and far post calls.',
    rule: 'Goal frame visible on every strike. Ten seconds maximum between attempts.',
  },
  {
    id: 'd5', stat: 'DEF', reward: '+2 DEF', title: '1v1 Jockey & Recovery', coach: 'Coach Elena',
    level: 'Intermediate', focus: 'Positioning & Tackling', duration: '16 mins', completes: 194, rating: '4.5',
    setup: 'A ten metre channel with two cones as the gate, one attacker, one ball.',
    execution: 'Jockey the attacker across the channel, force the weak side, win the ball inside the gate.',
    rule: 'Full channel in frame. Six repetitions, alternating sides.',
  },
  {
    id: 'd6', stat: 'PHY', reward: '+1 PHY', title: 'Late-Game Shuttle Endurance', coach: 'Coach Idris',
    level: 'Elite', focus: 'Stamina & Strength', duration: '22 mins', completes: 267, rating: '4.4',
    setup: 'Shuttle markers at 5, 10, 15 and 20 metres.',
    execution: 'Four sets of shuttles to each marker and back, 60 seconds rest between sets.',
    rule: 'Continuous footage of all four sets, timer visible.',
  },
]

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
      <path d="M7 4l13 8-13 8z" />
    </svg>
  )
}

export function DrillsPage() {
  const [cat, setCat] = useState('ALL')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All Levels')
  const [openId, setOpenId] = useState(null)

  const q = query.trim().toLowerCase()
  const list = DRILLS.filter(
    (d) =>
      (cat === 'ALL' || d.stat === cat) &&
      (level === 'All Levels' || d.level === level) &&
      (!q ||
        d.title.toLowerCase().includes(q) ||
        d.coach.toLowerCase().includes(q) ||
        d.focus.toLowerCase().includes(q)),
  )
  const active = DRILLS.find((d) => d.id === openId) || null

  useEffect(() => {
    if (!active) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  return (
    <PageShell>
      <section className="drills-head">
        <span className="pg-eyebrow">Drills Explorer Hub</span>
        <h1 className="pg-title">Training Drill Catalog</h1>
        <p className="pg-lead">
          Master targeted drills, submit video proof, and earn coach-verified attribute points.
        </p>

        <div className="drills-cats">
          {CATS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`chip ${c.key === cat ? 'is-active' : ''}`}
              onClick={() => setCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="drills-filter pg-card">
          <label className="drills-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A6784" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4.5-4.5" />
            </svg>
            <input
              type="text"
              placeholder="Search drills..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="drills-level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          >
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <span className="drills-count">
            {list.length} of {DRILLS.length} drills
          </span>
        </div>
      </section>

      <section className="drills-grid">
        {list.map((d) => (
          <article key={d.id} className="drill pg-card">
            <div className="drill__thumb">
              <span className="drill__reward">{d.reward}</span>
              <span className="drill__duration">{d.duration}</span>
              <span className="drill__play">
                <PlayIcon />
              </span>
            </div>
            <div className="drill__body">
              <h3 className="drill__title">{d.title}</h3>
              <span className="drill__coach">By {d.coach}</span>
              <span className="drill__tags">
                {d.level} • {d.focus}
              </span>
            </div>
            <div className="drill__meta">
              <span>{d.completes} Completes</span>
              <span className="drill__rating">★ {d.rating}</span>
            </div>
            <div className="drill__foot">
              <button type="button" className="pg-btn" onClick={() => setOpenId(d.id)}>
                View Drill &amp; Submit Proof
                <ArrowIcon size={16} />
              </button>
            </div>
          </article>
        ))}

        {list.length === 0 && (
          <div className="drills-empty pg-card">No drills match those filters.</div>
        )}
      </section>

      {active && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpenId(null)}>
          <div className="modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal__head">
              <div>
                <span className="pg-eyebrow">Drill Detail · Submission</span>
                <h2 className="modal__title">{active.title}</h2>
                <span className="modal__sub">
                  By {active.coach} · {active.level} • {active.focus} · {active.duration}
                </span>
              </div>
              <button
                type="button"
                className="modal__close"
                aria-label="Close"
                onClick={() => setOpenId(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal__body">
              <div className="modal__left">
                <div className="modal__video">
                  <span className="drill__play drill__play--lg">
                    <PlayIcon />
                  </span>
                  <span className="modal__video-tag">Tutorial · {active.duration}</span>
                </div>
                <ol className="modal__steps">
                  <li>
                    <span className="modal__step-n">01</span>
                    <div>
                      <strong>Setup</strong>
                      <p>{active.setup}</p>
                    </div>
                  </li>
                  <li>
                    <span className="modal__step-n">02</span>
                    <div>
                      <strong>Execution</strong>
                      <p>{active.execution}</p>
                    </div>
                  </li>
                  <li>
                    <span className="modal__step-n is-accent">03</span>
                    <div>
                      <strong>Verification Rule</strong>
                      <p>{active.rule}</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="modal__right">
                <span className="modal__reward">Reward · {active.reward}</span>

                <label className="modal__field">
                  <span className="modal__label">Video Proof</span>
                  <div className="modal__drop">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                      <path d="M12 16V4M8 8l4-4 4 4" />
                      <path d="M4 16v3h16v-3" />
                    </svg>
                    <strong>Drag &amp; drop video clip or paste link</strong>
                    <span>MP4 or MOV up to 200 MB · single continuous take, no cuts.</span>
                    <input type="text" placeholder="https://…" />
                  </div>
                </label>

                <label className="modal__field">
                  <span className="modal__label">Send to Coach</span>
                  <select>
                    {COACHES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <button type="button" className="pg-btn" onClick={() => setOpenId(null)}>
                  Submit to Coach for Approval ({active.reward})
                  <ArrowIcon size={16} />
                </button>
                <span className="modal__note">
                  Approvals usually land within 24 hours. Returned submissions include a coach note on
                  what to fix.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
