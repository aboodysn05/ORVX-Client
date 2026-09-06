import { useEffect, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-clubs.css'

// Admin Club Allocation & Squad Limits. Frontend only: mock clubs with local
// state for archive/restore, a confirm modal and a toast. Every club runs a
// fixed 16-player squad cap that admins cannot change, and head-coach
// assignment is handled elsewhere (no reassignment from this screen).

const SQUAD_CAP = 16

const CLUBS = [
  { id: 'c1', slot: 1, name: 'Apex Academy FC', coach: 'M. Okafor', roster: 14, division: 'Division A', pending: 3 },
  { id: 'c2', slot: 2, name: 'Cyber Strikers FC', coach: 'Unassigned', roster: 0, division: 'Division A', pending: 0, unassignedCoach: true },
  { id: 'c3', slot: 3, name: 'Vortex FC', coach: 'D. Whitlock', roster: 16, division: 'Division A', pending: 5 },
  { id: 'c4', slot: 4, name: 'Halcyon AC', coach: 'K. Bowen', roster: 11, division: 'Division A', pending: 2 },
  { id: 'c5', slot: 5, name: 'Meridian United', coach: 'P. Ivanović', roster: 12, division: 'Division B', pending: 4 },
  { id: 'c6', slot: 6, name: 'Ironline FC', coach: 'S. Petrov', roster: 9, division: 'Division B', pending: 1 },
  { id: 'c7', slot: 7, name: 'Northgate Rovers', coach: 'A. Mensah', roster: 10, division: 'Division B', pending: 6 },
  { id: 'c8', slot: 8, name: 'Vantage SC', coach: 'R. Calder', roster: 7, division: 'Division B', pending: 0 },
]

export function AdminClubsPage() {
  const [archived, setArchived] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  const isArchived = (c) => !!archived[c.id]

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  // Close the confirm modal on Escape.
  useEffect(() => {
    if (!confirm) return undefined
    const onKey = (e) => e.key === 'Escape' && setConfirm(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm])

  const live = CLUBS.filter((c) => !isArchived(c))
  const atCap = live.filter((c) => c.roster >= SQUAD_CAP).length
  const totalRoster = live.reduce((n, c) => n + c.roster, 0)
  const totalSeats = live.length * SQUAD_CAP
  const pendingTotal = live.reduce((n, c) => n + c.pending, 0)
  const cf = CLUBS.find((c) => c.id === confirm)

  function decorate(c) {
    const arch = isArchived(c)
    const full = c.roster >= SQUAD_CAP
    const over = c.roster > SQUAD_CAP
    const empty = c.roster === 0
    const pct = Math.min(100, Math.round((c.roster / SQUAD_CAP) * 100))
    const gaugeColor = arch
      ? '#4C5871'
      : over || full
        ? '#FF2E63'
        : pct >= 80
          ? '#F59E0B'
          : empty
            ? '#4F46E5'
            : '#10B981'
    const statusLabel = arch
      ? 'Archived'
      : c.unassignedCoach
        ? 'Awaiting Coach'
        : over
          ? 'Over Cap'
          : full
            ? 'Roster Full'
            : 'Open'
    const statusTone = arch ? 'grey' : c.unassignedCoach ? 'amber' : over || full ? 'pink' : 'green'
    const gaugeNote = arch
      ? 'Slot released · players returned to pool'
      : full
        ? 'At cap — new applications auto-reject'
        : empty
          ? 'No roster yet — club not populated'
          : `${SQUAD_CAP - c.roster} of ${SQUAD_CAP} slots open`
    return { arch, full, pct, gaugeColor, statusLabel, statusTone, gaugeNote }
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
    <AdminShell
      footerNote="OVRX Admin Console · Clubs & Capacity"
      footerRight="Squad cap is fixed at 16 for every club"
    >
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Eight Slots · Platform Hard Limit</span>
            <h1 className="adm-title">Club Allocation &amp; Squad Limits</h1>
            <p className="adm-lead">
              Every club runs a fixed 16-player squad cap. A club at capacity auto-rejects new
              player applications until a roster spot frees up.
            </p>
          </div>
          <div className="acl-headright">
            <button
              type="button"
              className="adm-btn"
              onClick={() =>
                fire(
                  live.length >= 8
                    ? 'All 8 slots in use — archive a club first'
                    : 'New club provisioning started',
                )
              }
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
            {
              k: 'Slots Used',
              v: `${live.length} / 8`,
              note: live.length === 8 ? 'no free slots' : 'free slots left',
              tone: 'indigo',
            },
            { k: 'Clubs At Cap', v: atCap, note: 'auto-rejecting', tone: 'pink' },
            { k: 'Total Roster', v: totalRoster, note: `of ${totalSeats} seats`, tone: 'green' },
            { k: 'Pending Apps', v: pendingTotal, note: 'across all clubs', tone: 'amber' },
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

      <section className="adm-section acl-gridsection">
        <div className="adm-tablewrap">
          <div className="adm-thead acl-lgrid">
            <span>Slot</span>
            <span>Club</span>
            <span>Head Coach</span>
            <span>Roster · Cap 16</span>
            <span>League</span>
            <span className="adm-th--right">Actions</span>
          </div>
          {CLUBS.map((c) => {
            const d = decorate(c)
            return (
              <div
                key={c.id}
                className={`adm-trow acl-lgrid ${d.arch ? 'is-archived' : ''}`}
                style={d.full && !d.arch ? { borderLeft: '2px solid #FF2E63' } : undefined}
              >
                <span
                  className="acl-lslot"
                  data-label="Slot"
                  style={{ color: d.arch ? '#4C5871' : d.full ? '#FF2E63' : '#F59E0B' }}
                >
                  {String(c.slot).padStart(2, '0')}
                </span>
                <span className="acl-lclub" data-label="Club">
                  <span className="acl-card__name">{c.name}</span>
                  <span className={`adm-pill adm-pill--${d.statusTone}`}>{d.statusLabel}</span>
                </span>
                <span className="acl-lcoach" data-label="Head Coach">
                  <span>{c.coach}</span>
                  <span className="acl-lcoach__note">{c.pending} pending apps</span>
                </span>
                <span className="acl-lcap" data-label="Roster">
                  <span className="acl-gauge__nums">
                    <span style={{ color: d.gaugeColor, fontWeight: 900 }}>{c.roster}</span>
                    <span className="acl-gauge__cap">/ {SQUAD_CAP}</span>
                  </span>
                  <span className="acl-lcap__bar">
                    <span
                      className="acl-gauge__fill"
                      style={{ width: `${d.pct}%`, background: d.gaugeColor }}
                    />
                  </span>
                  <span className="acl-lcap__note" style={{ color: d.gaugeColor }}>
                    {d.gaugeNote}
                  </span>
                </span>
                <span className="acl-ldiv" data-label="League">
                  {c.division}
                </span>
                <span className="adm-tc--right acl-lactions" data-label="Actions">
                  <button
                    type="button"
                    className={`acl-mini ${d.arch ? 'acl-mini--grey' : 'acl-mini--danger'}`}
                    onClick={() => archiveOrRestore(c)}
                  >
                    {d.arch ? 'Restore' : 'Archive Club'}
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {cf && (
        <div className="adm-modal">
          <div className="adm-modal__scrim" onClick={() => setConfirm(null)} />
          <div className="adm-modal__panel" role="dialog" aria-modal="true" aria-label={`Archive ${cf.name}`}>
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
