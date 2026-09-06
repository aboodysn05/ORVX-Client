import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-requests.css'

// Admin Club-Management Approval Queue — every request here is a coach asking to
// open and run one of the 8 platform club slots. Platform Evaluators are
// assigned by the platform, not self-serve, so they never appear in this queue.
// Frontend only: mock request data with local state for filter, per-request
// decision, and the dossier drawer.

const REQUESTS = [
  {
    id: 'r1', name: 'N. Adeyemi', email: 'n.adeyemi@vortexfc.co', initials: 'NA',
    club: 'Cyber Strikers FC', clubTag: 'New Club', isNew: true,
    doc: 'UEFA B Licence.pdf', date: '26 Aug 2026', age: '2 days', stale: false, years: '9 yrs',
    statement:
      'UEFA B qualified since 2019, currently running a grassroots 5v5 programme in Lagos with three age brackets. Requesting a platform club slot to move my existing 11-player squad onto OVRX for verified training records ahead of the autumn season.',
    checks: [
      { label: 'Licence document readable', ok: true },
      { label: 'Club name not already taken', ok: true },
      { label: 'Safeguarding certificate on file', ok: false },
    ],
  },
  {
    id: 'r3', name: 'K. Bowen', email: 'k.bowen@halcyonac.uk', initials: 'KB',
    club: 'Halcyon AC', clubTag: 'Existing Club · Slot 04', isNew: false,
    doc: 'FA Level 2.pdf', date: '23 Aug 2026', age: '5 days', stale: true, years: '6 yrs',
    statement:
      'Taking over Halcyon AC after the previous head coach stepped down. FA Level 2 with six years at the club as assistant. Need management rights to approve the four training submissions currently sitting unreviewed in the squad queue.',
    checks: [
      { label: 'Licence document readable', ok: true },
      { label: 'Outgoing coach confirmed handover', ok: false },
      { label: 'Safeguarding certificate on file', ok: true },
    ],
  },
  {
    id: 'r4', name: 'S. Petrov', email: 's.petrov@ironline.fc', initials: 'SP',
    club: 'Ironline FC', clubTag: 'New Club', isNew: true,
    doc: 'Coaching CV.pdf', date: '22 Aug 2026', age: '6 days', stale: true, years: '3 yrs',
    statement:
      'Three seasons coaching an adult 5v5 side. No formal licence uploaded yet — attaching my CV and two references while the certificate is reissued by the federation.',
    checks: [
      { label: 'Licence document readable', ok: false },
      { label: 'Club name not already taken', ok: true },
      { label: 'Safeguarding certificate on file', ok: false },
    ],
  },
]

const FILTERS = ['Pending', 'Over 4 Days', 'Approved', 'Declined', 'All']
const STATUS_TONE = { Approved: 'green', Declined: 'pink' }

const hasMissingDoc = (r) => r.checks.some((c) => !c.ok)

export function AdminRequestsPage() {
  const [decisions, setDecisions] = useState({})
  const [filter, setFilter] = useState('Pending')
  const [selectedId, setSelectedId] = useState(null)

  const statusOf = (id) => decisions[id] || 'Pending'
  const setStatus = (id, status) => setDecisions((s) => ({ ...s, [id]: status }))
  const clearStatus = (id) =>
    setDecisions((s) => {
      const next = { ...s }
      delete next[id]
      return next
    })

  // Close the dossier drawer on Escape.
  useEffect(() => {
    if (!selectedId) return undefined
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  const counts = useMemo(() => {
    const pending = REQUESTS.filter((r) => statusOf(r.id) === 'Pending')
    return {
      Pending: pending.length,
      'Over 4 Days': pending.filter((r) => r.stale).length,
      'Missing Docs': pending.filter(hasMissingDoc).length,
      Approved: REQUESTS.filter((r) => statusOf(r.id) === 'Approved').length,
      Declined: REQUESTS.filter((r) => statusOf(r.id) === 'Declined').length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions])

  const visible = REQUESTS.filter((r) => {
    const status = statusOf(r.id)
    if (filter === 'All') return true
    if (filter === 'Pending') return status === 'Pending'
    if (filter === 'Over 4 Days') return status === 'Pending' && r.stale
    return status === filter
  })

  const sel = REQUESTS.find((r) => r.id === selectedId) || null

  return (
    <AdminShell
      footerNote="OVRX Admin Console · Requests"
      footerRight="Every approval is written to the audit log"
    >
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Gateway Submissions · Manual Review</span>
            <h1 className="adm-title">Club Management Approval Queue</h1>
            <p className="adm-lead">
              Every coach who submits the gateway form lands here with their nav locked. Approving a
              request provisions the club record, assigns a league slot, and unlocks Squad and Review
              Queue for that account. Platform Evaluators are assigned internally and never appear
              here.
            </p>
          </div>
          <div className="adm-counters">
            <span className="adm-counter adm-counter--amber">
              <span className="adm-counter__k">Pending Total</span>
              <span className="adm-counter__v">{counts.Pending}</span>
            </span>
            <span className="adm-counter adm-counter--pink">
              <span className="adm-counter__k">Missing Docs</span>
              <span className="adm-counter__v">{counts['Missing Docs']}</span>
            </span>
            <span className="adm-counter adm-counter--indigo">
              <span className="adm-counter__k">Over 4 Days</span>
              <span className="adm-counter__v">{counts['Over 4 Days']}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="adm-section arq-filters">
        <div className="arq-filters__chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`adm-chipbtn ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {counts[f] != null && <span className="arq-chipcount">{counts[f]}</span>}
            </button>
          ))}
        </div>
        <span className="arq-filters__hint">Click any row for full credentials</span>
      </section>

      <section className="adm-section arq-tablesection">
        <div className="adm-tablewrap">
          <div className="adm-thead arq-grid">
            <span>Applicant</span>
            <span>Target Club</span>
            <span>Credentials</span>
            <span>Submitted</span>
            <span className="adm-th--right">Actions</span>
          </div>

          {visible.map((r) => {
            const status = statusOf(r.id)
            const borderColor =
              status === 'Approved' ? '#10B981' : status === 'Declined' ? '#FF2E63' : 'transparent'
            return (
              <div
                key={r.id}
                className="adm-trow adm-trow--clickable arq-grid"
                style={{ borderLeft: `2px solid ${borderColor}` }}
                role="button"
                tabIndex={0}
                aria-label={`Open dossier for ${r.name}, ${r.club}`}
                onClick={() => setSelectedId(r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedId(r.id)
                  }
                }}
              >
                <span className="arq-applicant" data-label="Applicant">
                  <span className="adm-avatar">{r.initials}</span>
                  <span className="arq-applicant__id">
                    <span className="arq-applicant__name">{r.name}</span>
                    <span className="arq-applicant__email">{r.email}</span>
                  </span>
                </span>

                <span className="arq-club" data-label="Target Club">
                  <span className="arq-club__name">{r.club}</span>
                  <span
                    className={`arq-club__tag ${r.isNew ? 'is-new' : ''}`}
                  >
                    {r.clubTag}
                  </span>
                </span>

                <span className="arq-cred" data-label="Credentials">
                  <span className="arq-doc">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 3H6v18h12V7l-4-4z" />
                      <path d="M14 3v4h4" />
                    </svg>
                    {r.doc}
                  </span>
                  <span className="arq-cred__years">{r.years} experience</span>
                </span>

                <span className="arq-date" data-label="Submitted">
                  <span className="arq-date__d">{r.date}</span>
                  <span className={`arq-date__age ${r.stale ? 'is-stale' : ''}`}>
                    {r.age} in queue
                  </span>
                </span>

                <span
                  className="arq-actions adm-tc--right"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {status === 'Pending' ? (
                    <>
                      <button
                        type="button"
                        className="arq-act arq-act--approve"
                        onClick={() => setSelectedId(r.id)}
                      >
                        Review &amp; Approve
                      </button>
                      <button
                        type="button"
                        className="arq-act arq-act--decline"
                        onClick={() => setStatus(r.id, 'Declined')}
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`adm-pill adm-pill--${STATUS_TONE[status]}`}>{status}</span>
                      <button
                        type="button"
                        className="arq-act arq-act--undo"
                        onClick={() => clearStatus(r.id)}
                      >
                        Undo
                      </button>
                    </>
                  )}
                </span>
              </div>
            )
          })}

          {visible.length === 0 && (
            <div className="adm-empty">
              <span className="adm-empty__title">Queue Clear</span>
              <span className="adm-empty__note">No requests match this filter.</span>
            </div>
          )}
        </div>
      </section>

      {sel && (
        <div className="adm-drawer">
          <div className="adm-drawer__scrim" onClick={() => setSelectedId(null)} />
          <aside className="adm-drawer__panel" role="dialog" aria-modal="true" aria-label={`${sel.name} dossier`}>
            <div className="adm-drawer__head">
              <span>
                <span className="adm-drawer__eyebrow">Applicant Dossier</span>
                <span className="adm-drawer__title" style={{ display: 'block' }}>
                  {sel.name}
                </span>
                <span className="adm-drawer__sub" style={{ display: 'block' }}>
                  {sel.email} · submitted {sel.date}
                </span>
              </span>
              <button
                type="button"
                className="adm-drawer__close"
                aria-label="Close"
                onClick={() => setSelectedId(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="adm-drawer__body">
              <div className="arq-facts">
                {[
                  { k: 'Requested Role', v: 'Club Owner', color: '#FF2E63' },
                  { k: 'Target Club', v: sel.club, color: '#fff' },
                  { k: 'Experience', v: sel.years, color: '#fff' },
                  {
                    k: 'Current Status',
                    v: statusOf(sel.id),
                    color:
                      statusOf(sel.id) === 'Approved'
                        ? '#10B981'
                        : statusOf(sel.id) === 'Declined'
                          ? '#FF2E63'
                          : '#F59E0B',
                  },
                ].map((f) => (
                  <span key={f.k} className="arq-fact">
                    <span className="arq-fact__k">{f.k}</span>
                    <span className="arq-fact__v" style={{ color: f.color }}>
                      {f.v}
                    </span>
                  </span>
                ))}
              </div>

              <div className="arq-block">
                <span className="arq-block__label">Credentials Statement</span>
                <p className="arq-statement">{sel.statement}</p>
                <span className="arq-openbtn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M14 3H6v18h12V7l-4-4z" />
                    <path d="M14 3v4h4" />
                  </svg>
                  Open {sel.doc}
                </span>
              </div>

              <div className="arq-block">
                <span className="arq-block__label">Verification Checklist</span>
                {sel.checks.map((c) => (
                  <span key={c.label} className="arq-check">
                    <span
                      className="arq-check__box"
                      style={{
                        borderColor: c.ok ? '#10B981' : '#F59E0B',
                        color: c.ok ? '#10B981' : '#F59E0B',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d={c.ok ? 'M5 13l4 4L19 7' : 'M12 7v7M12 17v.5'} />
                      </svg>
                    </span>
                    <span className="arq-check__label">{c.label}</span>
                    <span
                      className="arq-check__state"
                      style={{ color: c.ok ? '#10B981' : '#F59E0B' }}
                    >
                      {c.ok ? 'Verified' : 'Missing'}
                    </span>
                  </span>
                ))}
              </div>

              <div className="arq-notice">
                <span className="arq-notice__eyebrow">
                  <span className="arq-notice__dot" />
                  Provisioning Notice
                </span>
                <p className="arq-notice__text">
                  Approving this request will provision the club record — {sel.club} — assign a league
                  slot and unlock Squad and Review Queue for this account. Proceed?
                </p>
                <span className="arq-notice__actions">
                  <button
                    type="button"
                    className="adm-btn adm-btn--green"
                    onClick={() => {
                      setStatus(sel.id, 'Approved')
                      setSelectedId(null)
                    }}
                  >
                    Proceed · Grant Access
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn--danger"
                    onClick={() => {
                      setStatus(sel.id, 'Declined')
                      setSelectedId(null)
                    }}
                  >
                    Decline Request
                  </button>
                  <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setSelectedId(null)}>
                    Cancel
                  </button>
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  )
}
