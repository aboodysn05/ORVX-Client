import { useCallback, useEffect, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import { listAdminClubs, archiveClub, restoreClub, provisionClub } from '../api/admin'
import '../styles/admin-clubs.css'

// Admin Club Allocation — live from GET /admin/clubs. Provision claims the
// lowest free slot, archive frees the slot and dumps the roster back to the
// scouting pool, restore re-claims a free slot.

const SQUAD_CAP = 16

export function AdminClubsPage() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null) // club object being archived
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const fire = (msg) => {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  const load = useCallback(() => {
    setLoading(true)
    listAdminClubs()
      .then((rows) => {
        setClubs(rows)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load clubs.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (!confirm) return undefined
    const onKey = (e) => e.key === 'Escape' && setConfirm(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm])

  const live = clubs.filter((c) => !c.archived)
  const atCap = live.filter((c) => c.rosterCount >= SQUAD_CAP).length
  const totalRoster = live.reduce((n, c) => n + c.rosterCount, 0)
  const totalSeats = live.length * SQUAD_CAP
  const freeSlots = 8 - live.length

  function decorate(c) {
    const arch = c.archived
    const full = c.rosterCount >= SQUAD_CAP
    const empty = c.rosterCount === 0
    const noCoach = !c.headCoachName && !arch
    const pct = Math.min(100, Math.round((c.rosterCount / SQUAD_CAP) * 100))
    const gaugeColor = arch
      ? '#4C5871'
      : full
        ? '#FF2E63'
        : pct >= 80
          ? '#F59E0B'
          : empty
            ? '#4F46E5'
            : '#10B981'
    const statusLabel = arch ? 'Archived' : noCoach ? 'Awaiting Coach' : full ? 'Roster Full' : 'Open'
    const statusTone = arch ? 'grey' : noCoach ? 'amber' : full ? 'pink' : 'green'
    const gaugeNote = arch
      ? 'Slot released · players returned to pool'
      : full
        ? 'At cap — new applications auto-reject'
        : empty
          ? 'No roster yet — club not populated'
          : `${SQUAD_CAP - c.rosterCount} of ${SQUAD_CAP} slots open`
    return { arch, full, pct, gaugeColor, statusLabel, statusTone, gaugeNote }
  }

  async function doArchive(c) {
    setBusy(true)
    try {
      await archiveClub(c.id)
      fire(`${c.name} archived · slot ${c.slot} released`)
      setConfirm(null)
      load()
    } catch (err) {
      fire(err.response?.data?.message || 'Archive failed.')
    } finally {
      setBusy(false)
    }
  }

  async function doRestore(c) {
    setBusy(true)
    try {
      const club = await restoreClub(c.id)
      fire(`${c.name} restored to slot ${club.slot}`)
      load()
    } catch (err) {
      fire(err.response?.data?.message || 'Restore failed.')
    } finally {
      setBusy(false)
    }
  }

  async function doProvision() {
    const name = window.prompt('New club name')
    if (!name || !name.trim()) return
    const division = window.prompt('Division (optional)') || undefined
    setBusy(true)
    try {
      const club = await provisionClub({ name: name.trim(), division })
      fire(`${club.name} provisioned in slot ${club.slot}`)
      load()
    } catch (err) {
      fire(err.response?.data?.message || 'Provision failed.')
    } finally {
      setBusy(false)
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
            <button type="button" className="adm-btn" disabled={busy || freeSlots <= 0} onClick={doProvision}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {freeSlots > 0 ? 'Provision New Club' : 'All 8 Slots Used'}
            </button>
          </div>
        </div>

        <div className="acl-counters">
          {[
            { k: 'Slots Used', v: `${live.length} / 8`, note: freeSlots > 0 ? `${freeSlots} free` : 'no free slots', tone: 'indigo' },
            { k: 'Clubs At Cap', v: atCap, note: 'auto-rejecting', tone: 'pink' },
            { k: 'Total Roster', v: totalRoster, note: `of ${totalSeats} seats`, tone: 'green' },
            { k: 'Archived', v: clubs.length - live.length, note: 'slots freed', tone: 'amber' },
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

          {loading && <div className="adm-empty"><span className="adm-empty__note">Loading clubs…</span></div>}
          {error && !loading && (
            <div className="adm-empty">
              <span className="adm-empty__title">Couldn't load</span>
              <span className="adm-empty__note">{error}</span>
            </div>
          )}

          {!loading && !error && clubs.map((c) => {
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
                  {c.slot ? String(c.slot).padStart(2, '0') : '—'}
                </span>
                <span className="acl-lclub" data-label="Club">
                  <span className="acl-card__name">{c.name}</span>
                  <span className={`adm-pill adm-pill--${d.statusTone}`}>{d.statusLabel}</span>
                </span>
                <span className="acl-lcoach" data-label="Head Coach">
                  <span>{c.headCoachName || 'Unassigned'}</span>
                  <span className="acl-lcoach__note">{c.division || 'No division'}</span>
                </span>
                <span className="acl-lcap" data-label="Roster">
                  <span className="acl-gauge__nums">
                    <span style={{ color: d.gaugeColor, fontWeight: 900 }}>{c.rosterCount}</span>
                    <span className="acl-gauge__cap">/ {SQUAD_CAP}</span>
                  </span>
                  <span className="acl-lcap__bar">
                    <span className="acl-gauge__fill" style={{ width: `${d.pct}%`, background: d.gaugeColor }} />
                  </span>
                  <span className="acl-lcap__note" style={{ color: d.gaugeColor }}>{d.gaugeNote}</span>
                </span>
                <span className="acl-ldiv" data-label="League">{c.division || '—'}</span>
                <span className="adm-tc--right acl-lactions" data-label="Actions">
                  <button
                    type="button"
                    className={`acl-mini ${d.arch ? 'acl-mini--grey' : 'acl-mini--danger'}`}
                    disabled={busy}
                    onClick={() => (d.arch ? doRestore(c) : setConfirm(c))}
                  >
                    {d.arch ? 'Restore' : 'Archive Club'}
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {confirm && (
        <div className="adm-modal">
          <div className="adm-modal__scrim" onClick={() => setConfirm(null)} />
          <div className="adm-modal__panel" role="dialog" aria-modal="true" aria-label={`Archive ${confirm.name}`}>
            <span className="adm-modal__eyebrow">
              <span className="adm-modal__dot" />
              Destructive Action
            </span>
            <h2 className="adm-modal__title">Archive {confirm.name}?</h2>
            <p className="adm-modal__text">
              Archiving releases slot {String(confirm.slot).padStart(2, '0')}, unassigns all{' '}
              {confirm.rosterCount} players back to the scouting pool and revokes the head coach's
              management rights. Played matches are retained.
            </p>
            <div className="adm-modal__actions">
              <button type="button" className="adm-btn" disabled={busy} onClick={() => doArchive(confirm)}>
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
