import { useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { useAuth } from '../hooks/useAuth'
import { readCoachApplication } from '../utils/coachApplication'
import '../styles/coach-squad.css'

// Coach Squad Manager — translated from the design canvas
// (OVRX Squad Manager.dc.html). Frontend only: mock roster + applicant data
// with local state for position changes, signings and declines.

const CAPACITY = 16

const ROSTER = [
  { id: 1, name: 'R. Vasquez', initials: 'RV', position: 'Defender', ovr: 82, height: 181, weight: 77, lastActive: '2h ago', hot: true },
  { id: 2, name: 'S. Haruna', initials: 'SH', position: 'Attacker', ovr: 78, height: 176, weight: 70, lastActive: '5h ago', hot: true },
  { id: 3, name: 'D. Ferreira', initials: 'DF', position: 'Goalkeeper', ovr: 80, height: 188, weight: 82, lastActive: '1d ago' },
  { id: 4, name: 'A. Lindqvist', initials: 'AL', position: 'Attacker', ovr: 83, height: 179, weight: 74, lastActive: '3h ago', hot: true },
  { id: 5, name: 'M. Bianchi', initials: 'MB', position: 'Defender', ovr: 76, height: 184, weight: 79, lastActive: '2d ago' },
  { id: 6, name: 'P. Nowak', initials: 'PN', position: 'Attacker', ovr: 81, height: 175, weight: 71, lastActive: '6h ago', hot: true },
  { id: 7, name: 'E. Traoré', initials: 'ET', position: 'Defender', ovr: 79, height: 186, weight: 81, lastActive: '1d ago' },
  { id: 8, name: 'H. Yamada', initials: 'HY', position: 'Attacker', ovr: 74, height: 172, weight: 66, lastActive: '4d ago' },
  { id: 9, name: 'C. Mbeki', initials: 'CM', position: 'Goalkeeper', ovr: 77, height: 190, weight: 85, lastActive: '8h ago' },
  { id: 10, name: 'L. Petrov', initials: 'LP', position: 'Defender', ovr: 80, height: 183, weight: 78, lastActive: '1h ago', hot: true },
  { id: 11, name: 'N. Kovač', initials: 'NK', position: 'Attacker', ovr: 75, height: 177, weight: 72, lastActive: '3d ago' },
  { id: 12, name: 'F. Diallo', initials: 'FD', position: 'Defender', ovr: 84, height: 182, weight: 76, lastActive: '30m ago', hot: true },
]

const APPLICANTS = [
  { id: 101, name: 'J. Adeyemi', initials: 'JA', position: 'Attacker', ovr: 79, height: 178, weight: 72, date: '24 Aug 2026' },
  { id: 102, name: 'K. Ibarra', initials: 'KI', position: 'Goalkeeper', ovr: 74, height: 190, weight: 84, date: '23 Aug 2026' },
  { id: 103, name: 'T. Okonkwo', initials: 'TO', position: 'Attacker', ovr: 76, height: 174, weight: 68, date: '21 Aug 2026' },
]

const POSITIONS = ['Attacker', 'Defender', 'Goalkeeper']
const POS_TONE = { Attacker: 'pink', Defender: 'indigo', Goalkeeper: 'amber' }
const COLUMNS = ['Player', 'Position', 'Baseline OVR', 'Sessions Proof', 'Applied', 'Actions']

export function CoachSquadManagerPage() {
  const { user } = useAuth()
  const application = readCoachApplication(user?.email)
  const clubName = application?.clubName || 'Apex Academy FC'
  const capacity = application?.capacity || CAPACITY
  const crest = clubName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const [tab, setTab] = useState('roster')
  const [positions, setPositions] = useState(() =>
    ROSTER.reduce((m, p) => ({ ...m, [p.id]: p.position }), {}),
  )
  const [signed, setSigned] = useState([])
  const [declined, setDeclined] = useState([])
  const [toast, setToast] = useState(null)

  const signedList = APPLICANTS.filter((a) => signed.includes(a.id)).map((a) => ({
    ...a,
    lastActive: 'Just signed',
    hot: true,
  }))
  const squadCount = ROSTER.length + signedList.length
  const pending = APPLICANTS.filter((a) => !signed.includes(a.id) && !declined.includes(a.id))
  const full = squadCount >= capacity
  const pct = Math.round((squadCount / capacity) * 100)
  const capTone = full ? 'full' : pct >= 85 ? 'high' : 'ok'

  const roster = ROSTER.concat(signedList).map((p) => ({
    ...p,
    position: positions[p.id] || p.position,
  }))

  function setPosition(id, name, next) {
    setPositions((prev) => ({ ...prev, [id]: next }))
    setToast({ kind: 'position', name, extra: next })
  }

  function accept(a) {
    if (full) return
    setSigned((prev) => [...prev, a.id])
    setPositions((prev) => ({ ...prev, [a.id]: a.position }))
    setToast({ kind: 'accepted', name: a.name, extra: a.position })
  }

  function decline(a) {
    setDeclined((prev) => [...prev, a.id])
    setToast({ kind: 'declined', name: a.name, extra: '' })
  }

  return (
    <PageShell>
      <section className="csm-section">
        <div className="csm-header">
          <div className="csm-header__id">
            <span className="csm-crest">{crest}</span>
            <div className="csm-header__text">
              <span className="csm-club">{clubName}</span>
              <span className="csm-sub">Head Coach · {user?.name || 'Coach Marcus'} · Slot 1</span>
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
                ? 'Squad full — decline or release a player before signing'
                : `${capacity - squadCount} roster places open`}
            </span>
          </div>
        </div>

        <div className="csm-tabs">
          {[
            { key: 'roster', label: `Active Roster (${squadCount})` },
            { key: 'pending', label: `Pending Applications (${pending.length})` },
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

      {tab === 'roster' && (
        <section className="csm-panel">
          <div className="csm-panel__head">
            <h2 className="csm-panel__title">Active Roster</h2>
            <span className="csm-panel__hint">Position changes apply immediately</span>
          </div>

          <div className="csm-roster">
            {roster.map((p) => (
              <div key={p.id} className="csm-card">
                <div className="csm-card__top">
                  <span className="csm-avatar">{p.initials}</span>
                  <span className="csm-card__id">
                    <span className="csm-card__name">{p.name}</span>
                    <span className={`csm-pos is-${POS_TONE[p.position]}`}>{p.position}</span>
                  </span>
                  <span className="csm-card__ovr">
                    <span className="csm-card__ovr-v">{p.ovr}</span>
                    <span className="csm-card__ovr-l">OVR</span>
                  </span>
                </div>

                <div className="csm-card__metrics">
                  <span className="csm-metric">
                    <span className="csm-metric__k">Height</span>
                    <span className="csm-metric__v">{p.height} cm</span>
                  </span>
                  <span className="csm-metric">
                    <span className="csm-metric__k">Weight</span>
                    <span className="csm-metric__v">{p.weight} kg</span>
                  </span>
                  <span className="csm-metric">
                    <span className="csm-metric__k">Last Active</span>
                    <span className={`csm-metric__v ${p.hot ? 'is-hot' : ''}`}>{p.lastActive}</span>
                  </span>
                </div>

                <label className="csm-card__update">
                  <span className="csm-card__update-label">Update Position</span>
                  <select
                    className="csm-select"
                    value={p.position}
                    onChange={(e) => setPosition(p.id, p.name, e.target.value)}
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'pending' && (
        <section className="csm-panel">
          <div className="csm-panel__head">
            <h2 className="csm-panel__title">Pending Applications</h2>
            <span className="csm-panel__hint">
              All applicants completed 3 baseline sessions with Coach #9
            </span>
          </div>

          {pending.length > 0 ? (
            <div className="csm-table">
              <div className="csm-table__head">
                {COLUMNS.map((c) => (
                  <span key={c} className="csm-table__col">
                    {c}
                  </span>
                ))}
              </div>
              {pending.map((a) => (
                <div key={a.id} className="csm-table__row">
                  <span className="csm-table__player">
                    <span className="csm-avatar csm-avatar--sm">{a.initials}</span>
                    <span className="csm-table__player-id">
                      <span className="csm-table__player-name">{a.name}</span>
                      <span className="csm-table__player-phys">
                        {a.height} cm · {a.weight} kg
                      </span>
                    </span>
                  </span>
                  <span className={`csm-pos is-${POS_TONE[a.position]}`}>{a.position}</span>
                  <span className="csm-table__ovr">{a.ovr}</span>
                  <span className="csm-table__proof">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    3/3 Verified
                  </span>
                  <span className="csm-table__date">{a.date}</span>
                  <span className="csm-table__actions">
                    <button type="button" className="csm-decline" onClick={() => decline(a)}>
                      Decline
                    </button>
                    <button
                      type="button"
                      className="csm-accept"
                      disabled={full}
                      onClick={() => accept(a)}
                    >
                      {full ? 'Squad Full' : 'Accept into Squad'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="csm-empty">
              <span className="csm-empty__title">No open applications</span>
              <span className="csm-empty__note">
                Free agents appear here once Coach #9 has approved all three of their baseline
                sessions.
              </span>
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
            <span className="csm-toast__title">
              {toast.kind === 'accepted'
                ? 'Player signed'
                : toast.kind === 'declined'
                  ? 'Application declined'
                  : 'Position updated'}
            </span>
            <span className="csm-toast__body">
              {toast.kind === 'accepted'
                ? `${toast.name} has joined ${clubName} as ${toast.extra}. Their training queue now routes to you.`
                : toast.kind === 'declined'
                  ? `${toast.name}'s application was declined. They stay a free agent and can apply to other clubs.`
                  : `${toast.name} is now registered as ${toast.extra}. Their attribute set updates on the next session.`}
            </span>
          </span>
          <button
            type="button"
            className="csm-toast__close"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </PageShell>
  )
}
