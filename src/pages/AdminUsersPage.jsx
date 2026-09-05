import { useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-users.css'

// Admin Global User Directory — translated from OVRX Admin Users.dc.html.
// Frontend only: mock user list, local state for search/filters, a per-row
// actions menu, suspension toggles and a transient toast.

const USERS = [
  { id: 'u1', name: 'J. Rivera', uid: 'PLR-1042', email: 'jordan@ovrx.app', role: 'Player', position: 'Attacker', club: 'Apex Academy FC', clubNote: 'Signed · Slot 01', baseline: 3, evaluator: null },
  { id: 'u2', name: 'K. Osei', uid: 'PLR-1119', email: 'k.osei@ovrx.app', role: 'Player', position: 'Defender', club: 'Unassigned', clubNote: 'Evaluator: Coach #9', baseline: 2, evaluator: 'Coach #9' },
  { id: 'u3', name: 'T. Nowak', uid: 'PLR-1204', email: 'new@ovrx.app', role: 'Player', position: '—', club: 'Unassigned', clubNote: 'Assessment incomplete', baseline: 0, evaluator: 'Coach #9' },
  { id: 'u4', name: 'M. Okafor', uid: 'CCH-0031', email: 'marcus@apexacademy.fc', role: 'Coach', position: 'n/a', club: 'Apex Academy FC', clubNote: 'Head Coach · Approved', baseline: null, evaluator: null },
  { id: 'u5', name: 'Coach #9', uid: 'EVL-0009', email: 'evaluator9@ovrx.app', role: 'Coach', position: 'n/a', club: 'Platform Evaluator', clubNote: 'Baseline pool · 57 assigned', baseline: null, evaluator: null },
  { id: 'u6', name: 'S. Haddad', uid: 'PLR-1288', email: 's.haddad@ovrx.app', role: 'Player', position: 'Goalkeeper', club: 'Vortex FC', clubNote: 'Signed · Slot 03', baseline: 3, evaluator: null, suspended: true },
  { id: 'u7', name: 'D. Fenwick', uid: 'PLR-1305', email: 'd.fenwick@ovrx.app', role: 'Player', position: 'Attacker', club: 'Unassigned', clubNote: 'Evaluator: Coach #9', baseline: 1, evaluator: 'Coach #9' },
  { id: 'u8', name: 'A. Duarte', uid: 'ADM-0001', email: 'admin@ovrx.app', role: 'Admin', position: 'n/a', club: 'Platform', clubNote: 'Root access', baseline: null, evaluator: null },
  { id: 'u9', name: 'R. Villanueva', uid: 'PLR-1341', email: 'r.villanueva@ovrx.app', role: 'Player', position: 'Defender', club: 'Halcyon AC', clubNote: 'Signed · Slot 04', baseline: 3, evaluator: null },
  { id: 'u10', name: 'B. Lindqvist', uid: 'PLR-1367', email: 'b.lindqvist@ovrx.app', role: 'Player', position: '—', club: 'Unassigned', clubNote: 'Assessment incomplete', baseline: 0, evaluator: 'Unassigned' },
]

const ROLE_TONE = { Admin: 'amber', Coach: 'indigo', Player: 'pink' }
const BASE_COLOR = { 0: '#FF2E63', 1: '#F59E0B', 2: '#F59E0B', 3: '#10B981' }

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All Roles')
  const [club, setClub] = useState('All Clubs')
  const [assessed, setAssessed] = useState('Any Status')
  const [suspended, setSuspended] = useState({})
  const [menu, setMenu] = useState(null)
  const [toast, setToast] = useState('')

  const isSuspended = (u) => suspended[u.id] ?? !!u.suspended

  function fire(msg) {
    setMenu(null)
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  function toggleSuspend(u) {
    const now = !isSuspended(u)
    setSuspended((s) => ({ ...s, [u.id]: now }))
    fire(now ? `${u.name} suspended` : `${u.name} reactivated`)
  }

  const q = query.trim().toLowerCase()
  const visible = USERS.filter((u) => {
    if (q && ![u.email, u.uid, u.name].some((v) => v.toLowerCase().includes(q))) return false
    if (role !== 'All Roles' && u.role !== role) return false
    if (club === 'Unassigned Only' && u.club !== 'Unassigned') return false
    if (club !== 'All Clubs' && club !== 'Unassigned Only' && u.club !== club) return false
    if (assessed === 'Complete' && u.role === 'Player' && u.position === '—') return false
    if (assessed === 'Incomplete' && !(u.role === 'Player' && u.position === '—')) return false
    return true
  })

  const players = USERS.filter((u) => u.role === 'Player')
  const counters = [
    { k: 'Total Accounts', v: USERS.length, tone: 'indigo' },
    { k: 'Unassigned', v: players.filter((u) => u.club === 'Unassigned').length, tone: 'amber' },
    { k: 'Suspended', v: USERS.filter(isSuspended).length, tone: 'pink' },
    { k: 'Baseline 3/3', v: players.filter((u) => u.baseline === 3).length, tone: 'green' },
  ]

  const openUser = USERS.find((u) => u.id === menu)

  function menuActions(u) {
    const isPlayer = u.role === 'Player'
    const posLocked = isPlayer && u.position !== '—'
    return [
      { label: 'View Profile', onClick: () => fire(`Opening profile · ${u.uid}`) },
      { label: 'Reset Password', note: `Sends a one-time link to ${u.email}`, onClick: () => fire(`Reset link sent to ${u.email}`) },
      {
        label: 'Reassign Platform Evaluator',
        note: isPlayer ? (u.evaluator ? `Currently ${u.evaluator}` : 'No evaluator assigned') : 'Players only',
        disabled: !isPlayer,
        onClick: () => fire(`${u.name} reassigned to evaluator pool`),
      },
      {
        label: posLocked ? 'Unlock / Reset Position' : 'Position Not Yet Set',
        note: posLocked ? 'Overrides the coach-only rule' : 'Player has not completed assessment',
        disabled: !posLocked,
        onClick: () => fire(`${u.name} position unlocked — ${u.position} cleared`),
      },
      {
        label: isSuspended(u) ? 'Reactivate Account' : 'Suspend Account',
        danger: !isSuspended(u),
        onClick: () => toggleSuspend(u),
      },
    ]
  }

  return (
    <AdminShell footerNote="OVRX Admin Console · User Directory" footerRight="Position overrides bypass the coach-only rule">
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Identity &amp; Access · Root Only</span>
            <h1 className="adm-title">Global User Directory</h1>
            <p className="adm-lead">
              Every player, coach and admin on the platform. This is where a stuck baseline counter,
              a wrongly-locked position or a misrouted evaluator gets corrected.
            </p>
          </div>
          <div className="adm-counters">
            {counters.map((c) => (
              <span key={c.k} className={`adm-counter adm-counter--${c.tone}`}>
                <span className="adm-counter__k">{c.k}</span>
                <span className="adm-counter__v">{c.v}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="adm-section">
        <div className="aus-filters">
          <label className="adm-field aus-search">
            <span className="adm-field__label">Search</span>
            <span className="aus-search__box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A6784" strokeWidth="2.4">
                <circle cx="11" cy="11" r="7" />
                <path d="M16 16l5 5" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setMenu(null)
                }}
                placeholder="Email or user ID"
              />
            </span>
          </label>

          <label className="adm-field aus-select">
            <span className="adm-field__label">Role</span>
            <select className="adm-select" value={role} onChange={(e) => setRole(e.target.value)}>
              {['All Roles', 'Player', 'Coach', 'Admin'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="adm-field aus-select">
            <span className="adm-field__label">Club</span>
            <select className="adm-select" value={club} onChange={(e) => setClub(e.target.value)}>
              {['All Clubs', 'Unassigned Only', 'Apex Academy FC', 'Vortex FC', 'Halcyon AC'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="adm-field aus-select">
            <span className="adm-field__label">Assessed Status</span>
            <select className="adm-select" value={assessed} onChange={(e) => setAssessed(e.target.value)}>
              {['Any Status', 'Complete', 'Incomplete'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={() => {
              setQuery('')
              setRole('All Roles')
              setClub('All Clubs')
              setAssessed('Any Status')
              setMenu(null)
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="adm-section aus-tablesection">
        <div className="aus-resultbar">
          <span>
            {visible.length} of {USERS.length} accounts shown
          </span>
          <span>Actions are logged against your admin ID</span>
        </div>

        <div className="adm-tablewrap">
          <div className="adm-thead aus-grid">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Position</span>
            <span>Club / Evaluator</span>
            <span>Baseline</span>
            <span className="adm-th--right">Manage</span>
          </div>

          {visible.map((u) => {
            const susp = isSuspended(u)
            const isPlayer = u.role === 'Player'
            const pos = isPlayer ? u.position : '—'
            const baseColor = u.baseline === null ? '#5A6784' : BASE_COLOR[u.baseline]
            return (
              <div
                key={u.id}
                className="adm-trow aus-grid"
                style={susp ? { borderLeft: '2px solid #FF2E63', background: 'rgba(255,46,99,0.03)' } : undefined}
              >
                <span className="aus-name">
                  <span
                    className="adm-avatar"
                    style={susp ? { background: 'rgba(255,46,99,0.12)', borderColor: 'rgba(255,46,99,0.5)', color: '#fff' } : { color: '#fff' }}
                  >
                    {u.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'C9'}
                  </span>
                  <span className="aus-name__id">
                    <span className="aus-name__n">{u.name}</span>
                    <span className="aus-name__uid">{u.uid}</span>
                  </span>
                </span>

                <span className="aus-email">{u.email}</span>

                <span>
                  <span className={`adm-pill adm-pill--${ROLE_TONE[u.role]}`}>{u.role}</span>
                </span>

                <span className="aus-pos">
                  <span style={{ color: !isPlayer ? '#4C5871' : pos === '—' ? '#F59E0B' : '#E8ECF5' }}>{pos}</span>
                  {isPlayer && pos !== '—' && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.6">
                      <rect x="4" y="11" width="16" height="10" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  )}
                </span>

                <span className="aus-club">
                  <span className="aus-club__n">{u.club}</span>
                  <span className="aus-club__note" style={{ color: u.club === 'Unassigned' ? '#F59E0B' : '#5A6784' }}>
                    {u.clubNote}
                  </span>
                </span>

                <span className="aus-base">
                  <span className="aus-base__row">
                    <span className="aus-base__v" style={{ color: baseColor }}>
                      {u.baseline === null ? 'n/a' : `${u.baseline}/3`}
                    </span>
                    <span
                      className={`adm-pill adm-pill--${susp ? 'pink' : 'green'}`}
                    >
                      {susp ? 'Suspended' : 'Active'}
                    </span>
                  </span>
                  <span className="aus-base__bar">
                    <span
                      className="aus-base__fill"
                      style={{ width: `${u.baseline === null ? 0 : Math.round((u.baseline / 3) * 100)}%`, background: baseColor }}
                    />
                  </span>
                </span>

                <span className="adm-tc--right aus-menucell">
                  <button
                    type="button"
                    className={`aus-menubtn ${menu === u.id ? 'is-open' : ''}`}
                    aria-label="Admin actions"
                    onClick={() => setMenu(menu === u.id ? null : u.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </button>
                  {menu === u.id && (
                    <div className="aus-menu">
                      <span className="aus-menu__title">
                        {u.name} · {u.uid}
                      </span>
                      {menuActions(u).map((a, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`aus-menu__item ${a.disabled ? 'is-disabled' : ''} ${a.danger ? 'is-danger' : ''}`}
                          disabled={a.disabled}
                          onClick={a.disabled ? undefined : a.onClick}
                        >
                          <span>{a.label}</span>
                          {a.note && <span className="aus-menu__note">{a.note}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </span>
              </div>
            )
          })}

          {visible.length === 0 && (
            <div className="adm-empty">
              <span className="adm-empty__title">No Matches</span>
              <span className="adm-empty__note">Adjust the search or filters above.</span>
            </div>
          )}
        </div>
      </section>

      {menu && <div className="aus-menuscrim" onClick={() => setMenu(null)} />}

      {toast && (
        <div className="adm-toast adm-toast--green">
          <span className="adm-toast__dot" />
          <span className="adm-toast__msg">{toast}</span>
        </div>
      )}
    </AdminShell>
  )
}
