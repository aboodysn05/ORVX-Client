import { useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-clubs.css'

// Admin Club Allocation & Squad Limits — translated from
// OVRX Admin Clubs.dc.html. Frontend only: mock clubs, local state for the
// grid/list view, cap overrides, archive state, confirm modal and toast.

const CLUBS = [
  { id: 'c1', slot: 1, name: 'Apex Academy FC', coach: 'M. Okafor', roster: 14, cap: 16, division: 'Division A', pending: 3 },
  { id: 'c2', slot: 2, name: 'Cyber Strikers FC', coach: 'Unassigned', roster: 0, cap: 12, division: 'Division A', pending: 0, unassignedCoach: true },
  { id: 'c3', slot: 3, name: 'Vortex FC', coach: 'D. Whitlock', roster: 16, cap: 16, division: 'Division A', pending: 5 },
  { id: 'c4', slot: 4, name: 'Halcyon AC', coach: 'K. Bowen', roster: 11, cap: 12, division: 'Division A', pending: 2 },
  { id: 'c5', slot: 5, name: 'Meridian United', coach: 'P. Ivanović', roster: 12, cap: 12, division: 'Division B', pending: 4 },
  { id: 'c6', slot: 6, name: 'Ironline FC', coach: 'S. Petrov', roster: 9, cap: 20, division: 'Division B', pending: 1 },
  { id: 'c7', slot: 7, name: 'Northgate Rovers', coach: 'A. Mensah', roster: 10, cap: 10, division: 'Division B', pending: 6 },
  { id: 'c8', slot: 8, name: 'Vantage SC', coach: 'R. Calder', roster: 7, cap: 16, division: 'Division B', pending: 0 },
]

const CAP_OPTIONS = [10, 12, 16, 20]

export function AdminClubsPage() {
  const [view, setView] = useState('Grid')
  const [caps, setCaps] = useState({})
  const [archived, setArchived] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  const capOf = (c) => caps[c.id] ?? c.cap
  const isArchived = (c) => !!archived[c.id]

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  const live = CLUBS.filter((c) => !isArchived(c))
  const atCap = live.filter((c) => c.roster >= capOf(c)).length
  const totalRoster = live.reduce((n, c) => n + c.roster, 0)
  const totalCap = live.reduce((n, c) => n + capOf(c), 0)
  const cf = CLUBS.find((c) => c.id === confirm)

  function decorate(c) {
    const cap = capOf(c)
    const arch = isArchived(c)
    const full = c.roster >= cap
    const over = c.roster > cap
    const empty = c.roster === 0
    const pct = Math.min(100, Math.round((c.roster / cap) * 100))
    const gaugeColor = arch ? '#4C5871' : over || full ? '#FF2E63' : pct >= 80 ? '#F59E0B' : empty ? '#4F46E5' : '#10B981'
    const statusLabel = arch ? 'Archived' : c.unassignedCoach ? 'Awaiting Coach' : over ? 'Over Cap' : full ? 'Roster Full' : 'Open'
    const statusTone = arch ? 'grey' : c.unassignedCoach ? 'amber' : over || full ? 'pink' : 'green'
    const gaugeNote = arch
      ? 'Slot released · players returned to pool'
      : over
        ? `${c.roster - cap} over cap — remove players or raise the limit`
        : full
          ? 'At cap — new applications auto-reject'
          : empty
            ? 'No roster yet — club not yet populated'
            : `${cap - c.roster} slots open`
    return { cap, arch, full, pct, gaugeColor, statusLabel, statusTone, gaugeNote }
  }

  function archiveOrRestore(c) {
    if (isArchived(c)) {
      setArchived((prev) => {
        const next = { ...prev }
        delete next[c.id]
        return next
      })
      fire(`${c.name} restored to slot ${c.slot}`)
    } else {
      setConfirm(c.id)
    }
  }

  return (
    <AdminShell footerNote="OVRX Admin Console · Clubs & Capacity" footerRight="Cap changes take effect on the next application">
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Eight Slots · Platform Hard Limit</span>
            <h1 className="adm-title">Club Allocation &amp; Squad Limits</h1>
            <p className="adm-lead">
              A club at its cap auto-rejects new player applications. Raising a cap reopens the club
              to the application queue immediately.
            </p>
          </div>
          <div className="acl-headright">
            <span className="acl-viewtoggle">
              {['Grid', 'List'].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`acl-viewtoggle__btn ${view === v ? 'is-active' : ''}`}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </span>
            <button
              type="button"
              className="adm-btn"
              onClick={() => fire(live.length >= 8 ? 'All 8 slots in use — archive a club first' : 'New club provisioning started')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Provision New Club
            </button>
          </div>
        </div>

        <div className="acl-counters">
          {[
            { k: 'Slots Used', v: `${live.length} / 8`, note: live.length === 8 ? 'no free slots' : 'free slots left', tone: 'indigo' },
            { k: 'Clubs At Cap', v: atCap, note: 'auto-rejecting', tone: 'pink' },
            { k: 'Total Roster', v: totalRoster, note: `of ${totalCap} seats`, tone: 'green' },
            { k: 'Pending Apps', v: live.reduce((n, c) => n + c.pending, 0), note: 'across all clubs', tone: 'amber' },
          ].map((c) => (
            <span key={c.k} className={`adm-counter adm-counter--${c.tone}`}>
              <span className="adm-counter__k">{c.k}</span>
              <span className="adm-counter__v">
                {c.v}
                <span className="adm-counter__note">{c.note}</span>
              </span>
            </span>
          ))}
        </div>
      </section>

      {view === 'Grid' && (
        <section className="adm-section acl-gridsection">
          <div className="acl-grid">
            {CLUBS.map((c) => {
              const d = decorate(c)
              return (
                <div key={c.id} className={`acl-card ${d.arch ? 'is-archived' : ''} ${d.full && !d.arch ? 'is-full' : ''}`}>
                  <div className="acl-card__top">
                    <span className="acl-emblem" style={{ borderColor: d.arch ? 'rgba(148,163,184,0.25)' : d.full ? 'rgba(255,46,99,0.5)' : 'rgba(245,158,11,0.45)' }}>
                      <span className="acl-emblem__k">Slot</span>
                      <span className="acl-emblem__v" style={{ color: d.arch ? '#4C5871' : d.full ? '#FF2E63' : '#F59E0B' }}>
                        {String(c.slot).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="acl-card__id">
                      <span className="acl-card__namerow">
                        <span className="acl-card__name">{c.name}</span>
                        <span className={`adm-pill adm-pill--${d.statusTone}`}>{d.statusLabel}</span>
                      </span>
                      <span className="acl-card__coach">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A6784" strokeWidth="2.2">
                          <circle cx="12" cy="8" r="3.4" />
                          <path d="M5 21c0-4 3.1-6.4 7-6.4S19 17 19 21" />
                        </svg>
                        {c.coach}
                      </span>
                      <span className="acl-card__tags">
                        <span className="acl-tag acl-tag--indigo">{c.division}</span>
                        <span className="acl-tag acl-tag--grey">{c.pending} pending apps</span>
                      </span>
                    </span>
                  </div>

                  <div className="acl-gauge">
                    <span className="acl-gauge__row">
                      <span className="acl-gauge__k">Roster Capacity</span>
                      <span className="acl-gauge__nums">
                        <span className="acl-gauge__roster" style={{ color: d.gaugeColor }}>
                          {c.roster}
                        </span>
                        <span className="acl-gauge__cap">/ {d.cap}</span>
                      </span>
                    </span>
                    <span className="acl-gauge__bar">
                      <span className="acl-gauge__fill" style={{ width: `${d.pct}%`, background: d.gaugeColor, boxShadow: `0 0 14px ${d.gaugeColor}` }} />
                    </span>
                    <span className="acl-gauge__note" style={{ color: d.gaugeColor }}>
                      {d.gaugeNote}
                    </span>
                  </div>

                  <div className="acl-card__actions">
                    <label className="adm-field acl-capfield">
                      <span className="adm-field__label">Edit Squad Cap</span>
                      <select
                        className="adm-select"
                        value={d.cap}
                        onChange={(e) => {
                          const next = parseInt(e.target.value, 10)
                          setCaps((prev) => ({ ...prev, [c.id]: next }))
                          fire(`${c.name} cap set to ${next}`)
                        }}
                      >
                        {CAP_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o} players
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="acl-mini acl-mini--indigo" onClick={() => fire(`Coach reassignment opened · ${c.name}`)}>
                      Reassign Coach
                    </button>
                    <button type="button" className={`acl-mini ${d.arch ? 'acl-mini--grey' : 'acl-mini--danger'}`} onClick={() => archiveOrRestore(c)}>
                      {d.arch ? 'Restore' : 'Archive Club'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {view === 'List' && (
        <section className="adm-section acl-gridsection">
          <div className="adm-tablewrap">
            <div className="adm-thead acl-lgrid">
              <span>Slot</span>
              <span>Club</span>
              <span>Head Coach</span>
              <span>Capacity</span>
              <span>League</span>
              <span className="adm-th--right">Actions</span>
            </div>
            {CLUBS.map((c) => {
              const d = decorate(c)
              return (
                <div key={c.id} className={`adm-trow acl-lgrid ${d.arch ? 'is-archived' : ''}`} style={d.full && !d.arch ? { borderLeft: '2px solid #FF2E63' } : undefined}>
                  <span className="acl-lslot" style={{ color: d.arch ? '#4C5871' : d.full ? '#FF2E63' : '#F59E0B' }}>
                    {String(c.slot).padStart(2, '0')}
                  </span>
                  <span className="acl-lclub">
                    <span className="acl-card__name">{c.name}</span>
                    <span className={`adm-pill adm-pill--${d.statusTone}`}>{d.statusLabel}</span>
                  </span>
                  <span className="acl-lcoach">
                    <span>{c.coach}</span>
                    <span className="acl-lcoach__note">{c.pending} pending apps</span>
                  </span>
                  <span className="acl-lcap">
                    <span className="acl-gauge__nums">
                      <span style={{ color: d.gaugeColor, fontWeight: 900 }}>{c.roster}</span>
                      <span className="acl-gauge__cap">/ {d.cap}</span>
                    </span>
                    <span className="acl-lcap__bar">
                      <span className="acl-gauge__fill" style={{ width: `${d.pct}%`, background: d.gaugeColor }} />
                    </span>
                  </span>
                  <span className="acl-ldiv">{c.division}</span>
                  <span className="adm-tc--right acl-lactions">
                    <select
                      className="adm-select acl-lcapsel"
                      value={d.cap}
                      onChange={(e) => {
                        const next = parseInt(e.target.value, 10)
                        setCaps((prev) => ({ ...prev, [c.id]: next }))
                        fire(`${c.name} cap set to ${next}`)
                      }}
                    >
                      {CAP_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          Cap {o}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="acl-mini acl-mini--indigo" onClick={() => fire(`Coach reassignment opened · ${c.name}`)}>
                      Reassign Coach
                    </button>
                    <button type="button" className={`acl-mini ${d.arch ? 'acl-mini--grey' : 'acl-mini--danger'}`} onClick={() => archiveOrRestore(c)}>
                      {d.arch ? 'Restore' : 'Archive Club'}
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {cf && (
        <div className="adm-modal">
          <div className="adm-modal__scrim" onClick={() => setConfirm(null)} />
          <div className="adm-modal__panel">
            <span className="adm-modal__eyebrow">
              <span className="adm-modal__dot" />
              Destructive Action
            </span>
            <h2 className="adm-modal__title">Archive {cf.name}?</h2>
            <p className="adm-modal__text">
              Archiving releases slot {String(cf.slot).padStart(2, '0')}, unassigns all {cf.roster}{' '}
              players back to the free-agent pool and revokes the head coach's management rights.
              League fixtures already played are retained.
            </p>
            <div className="adm-modal__actions">
              <button
                type="button"
                className="adm-btn"
                onClick={() => {
                  setArchived((prev) => ({ ...prev, [cf.id]: true }))
                  setConfirm(null)
                  fire(`${cf.name} archived · slot ${cf.slot} released`)
                }}
              >
                Archive Club
              </button>
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="adm-toast adm-toast--green">
          <span className="adm-toast__dot" />
          <span className="adm-toast__msg">{toast}</span>
        </div>
      )}
    </AdminShell>
  )
}
