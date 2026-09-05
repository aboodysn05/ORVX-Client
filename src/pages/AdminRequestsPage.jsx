import { useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-requests.css'

// Admin Coach Onboarding Approval Queue — translated from
// OVRX Admin Requests.dc.html. Frontend only: mock request data with local
// state for filter, per-request status, and the dossier drawer.

const REQUESTS = [
  {
    id: 'r1', name: 'N. Adeyemi', email: 'n.adeyemi@vortexfc.co', initials: 'NA',
    role: 'Club Owner', club: 'Cyber Strikers FC', clubTag: 'New Club', isNew: true,
    doc: 'UEFA B Licence.pdf', date: '26 Aug 2026', age: '2 days', stale: false, years: '9 yrs',
    statement: 'UEFA B qualified since 2019, currently running a grassroots 5v5 programme in Lagos with three age brackets. Requesting a platform club slot to move my existing 11-player squad onto OVRX for verified training records ahead of the autumn season.',
    checks: [{ label: 'Licence document readable', ok: true }, { label: 'Club name not already taken', ok: true }, { label: 'Safeguarding certificate on file', ok: false }],
  },
  {
    id: 'r2', name: 'L. Marchetti', email: 'l.marchetti@ovrx.app', initials: 'LM',
    role: 'Platform Evaluator', club: 'Unaffiliated', clubTag: 'Evaluator Pool', isNew: false,
    doc: 'UEFA A Licence.pdf', date: '25 Aug 2026', age: '3 days', stale: false, years: '14 yrs',
    statement: 'Former academy fitness lead, UEFA A, fourteen years assessing youth intake. Applying to the evaluator pool to clear the unassessed backlog — I can commit to reviewing twenty baseline submissions a week.',
    checks: [{ label: 'Licence document readable', ok: true }, { label: 'No club affiliation conflict', ok: true }, { label: 'Safeguarding certificate on file', ok: true }],
  },
  {
    id: 'r3', name: 'K. Bowen', email: 'k.bowen@halcyonac.uk', initials: 'KB',
    role: 'Club Owner', club: 'Halcyon AC', clubTag: 'Existing Club · Slot 04', isNew: false,
    doc: 'FA Level 2.pdf', date: '23 Aug 2026', age: '5 days', stale: true, years: '6 yrs',
    statement: 'Taking over Halcyon AC after the previous head coach stepped down. FA Level 2 with six years at the club as assistant. Need management rights to approve the four training submissions currently sitting unreviewed in the squad queue.',
    checks: [{ label: 'Licence document readable', ok: true }, { label: 'Outgoing coach confirmed handover', ok: false }, { label: 'Safeguarding certificate on file', ok: true }],
  },
  {
    id: 'r4', name: 'S. Petrov', email: 's.petrov@ironline.fc', initials: 'SP',
    role: 'Club Owner', club: 'Ironline FC', clubTag: 'Existing Club · Slot 06', isNew: false,
    doc: 'Coaching CV.pdf', date: '22 Aug 2026', age: '6 days', stale: true, years: '3 yrs',
    statement: 'Three seasons coaching an adult 5v5 side. No formal licence uploaded yet — attaching my CV and two references while the certificate is reissued by the federation.',
    checks: [{ label: 'Licence document readable', ok: false }, { label: 'Club name not already taken', ok: true }, { label: 'Safeguarding certificate on file', ok: false }],
  },
  {
    id: 'r5', name: 'M. Rahal', email: 'm.rahal@ovrx.app', initials: 'MR',
    role: 'Platform Evaluator', club: 'Unaffiliated', clubTag: 'Evaluator Pool', isNew: false,
    doc: 'UEFA B Licence.pdf', date: '21 Aug 2026', age: '7 days', stale: true, years: '11 yrs',
    statement: 'Eleven years in grassroots talent identification, UEFA B. Happy to be assigned as a second evaluator alongside Coach #9 so unassigned players are not waiting on one reviewer.',
    checks: [{ label: 'Licence document readable', ok: true }, { label: 'No club affiliation conflict', ok: true }, { label: 'Safeguarding certificate on file', ok: true }],
  },
]

const FILTERS = ['Pending', 'Club Owner', 'Platform Evaluator', 'All']
const STATUS_TONE = { Approved: 'green', Declined: 'pink', 'Info Requested': 'indigo' }

export function AdminRequestsPage() {
  const [statuses, setStatuses] = useState({})
  const [filter, setFilter] = useState('Pending')
  const [selectedId, setSelectedId] = useState(null)

  const statusOf = (id) => statuses[id] || 'Pending'
  const setStatus = (id, status) => setStatuses((s) => ({ ...s, [id]: status }))
  const clearStatus = (id) =>
    setStatuses((s) => {
      const next = { ...s }
      delete next[id]
      return next
    })

  const pendingCount = REQUESTS.filter((r) => statusOf(r.id) === 'Pending').length
  const clubOwners = REQUESTS.filter((r) => statusOf(r.id) === 'Pending' && r.role === 'Club Owner').length
  const stale = REQUESTS.filter((r) => statusOf(r.id) === 'Pending' && r.stale).length

  const visible = REQUESTS.filter((r) => {
    if (filter === 'All') return true
    if (filter === 'Pending') return statusOf(r.id) === 'Pending'
    return r.role === filter
  })

  const sel = REQUESTS.find((r) => r.id === selectedId) || null
  const selIsClubOwner = sel?.role === 'Club Owner'

  return (
    <AdminShell footerNote="OVRX Admin Console · Requests" footerRight="Every approval is written to the audit log">
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Gateway Submissions · Manual Review</span>
            <h1 className="adm-title">Coach Onboarding Approval Queue</h1>
            <p className="adm-lead">
              Every coach who submits the gateway form lands here with their nav locked. Approving a
              club owner provisions the club record and unlocks Squad and Review Queue. Approving an
              evaluator adds them to the baseline assessment pool.
            </p>
          </div>
          <div className="adm-counters">
            <span className="adm-counter adm-counter--amber">
              <span className="adm-counter__k">Pending Total</span>
              <span className="adm-counter__v">{pendingCount}</span>
            </span>
            <span className="adm-counter adm-counter--pink">
              <span className="adm-counter__k">Club Owners</span>
              <span className="adm-counter__v">{clubOwners}</span>
            </span>
            <span className="adm-counter adm-counter--indigo">
              <span className="adm-counter__k">Over 4 Days</span>
              <span className="adm-counter__v">{stale}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="adm-section arq-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`adm-chipbtn ${filter === f ? 'is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className="arq-filters__hint">Click any row for full credentials</span>
      </section>

      <section className="adm-section arq-tablesection">
        <div className="adm-tablewrap">
          <div className="adm-thead arq-grid">
            <span>Applicant Name</span>
            <span>Requested Role</span>
            <span>Target Club</span>
            <span>Credentials</span>
            <span>Submitted</span>
            <span className="adm-th--right">Actions</span>
          </div>

          {visible.map((r) => {
            const status = statusOf(r.id)
            const isClubOwner = r.role === 'Club Owner'
            const borderColor =
              status === 'Approved' ? '#10B981' : status === 'Declined' ? '#FF2E63' : status === 'Info Requested' ? '#4F46E5' : 'transparent'
            return (
              <div
                key={r.id}
                className="adm-trow adm-trow--clickable arq-grid"
                style={{ borderLeft: `2px solid ${borderColor}` }}
                onClick={() => setSelectedId(r.id)}
              >
                <span className="arq-applicant">
                  <span className="adm-avatar">{r.initials}</span>
                  <span className="arq-applicant__id">
                    <span className="arq-applicant__name">{r.name}</span>
                    <span className="arq-applicant__email">{r.email}</span>
                  </span>
                </span>

                <span className="arq-role">
                  <span className={`adm-pill adm-pill--${isClubOwner ? 'pink' : 'indigo'}`}>{r.role}</span>
                  <span className="arq-role__note">
                    {isClubOwner ? 'Provisions club record' : 'Joins baseline pool'}
                  </span>
                </span>

                <span className="arq-club">
                  <span className="arq-club__name">{r.club}</span>
                  <span className="arq-club__tag" style={{ color: r.isNew ? '#F59E0B' : '#7C89A2' }}>
                    {r.clubTag}
                  </span>
                </span>

                <span className="arq-doc">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M14 3H6v18h12V7l-4-4z" />
                    <path d="M14 3v4h4" />
                  </svg>
                  {r.doc}
                </span>

                <span className="arq-date">
                  <span className="arq-date__d">{r.date}</span>
                  <span className="arq-date__age" style={{ color: r.stale ? '#F59E0B' : '#5A6784' }}>
                    {r.age} in queue
                  </span>
                </span>

                <span className="arq-actions adm-tc--right" onClick={(e) => e.stopPropagation()}>
                  {status === 'Pending' ? (
                    <>
                      <button type="button" className="arq-act arq-act--approve" onClick={() => setSelectedId(r.id)}>
                        Approve &amp; Grant Access
                      </button>
                      <button
                        type="button"
                        className="arq-act arq-act--info"
                        onClick={() => setStatus(r.id, 'Info Requested')}
                      >
                        Request More Info
                      </button>
                      <button type="button" className="arq-act arq-act--decline" onClick={() => setStatus(r.id, 'Declined')}>
                        Decline
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`adm-pill adm-pill--${STATUS_TONE[status]}`}>{status}</span>
                      <button type="button" className="arq-act arq-act--undo" onClick={() => clearStatus(r.id)}>
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
          <aside className="adm-drawer__panel">
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
              <button type="button" className="adm-drawer__close" aria-label="Close" onClick={() => setSelectedId(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="adm-drawer__body">
              <div className="arq-facts">
                {[
                  { k: 'Requested Role', v: sel.role, color: selIsClubOwner ? '#FF2E63' : '#A5B0FF' },
                  { k: 'Target Club', v: sel.club, color: '#fff' },
                  { k: 'Experience', v: sel.years, color: '#fff' },
                  {
                    k: 'Current Status',
                    v: statusOf(sel.id),
                    color:
                      statusOf(sel.id) === 'Approved' ? '#10B981' : statusOf(sel.id) === 'Declined' ? '#FF2E63' : '#F59E0B',
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
                    <span className="arq-check__box" style={{ borderColor: c.ok ? '#10B981' : '#F59E0B', color: c.ok ? '#10B981' : '#F59E0B' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d={c.ok ? 'M5 13l4 4L19 7' : 'M12 7v7M12 17v.5'} />
                      </svg>
                    </span>
                    <span className="arq-check__label">{c.label}</span>
                    <span className="arq-check__state" style={{ color: c.ok ? '#10B981' : '#F59E0B' }}>
                      {c.ok ? 'Verified' : 'Missing'}
                    </span>
                  </span>
                ))}
              </div>

              <div
                className="arq-notice"
                style={{
                  background: selIsClubOwner ? 'rgba(245,158,11,0.08)' : 'rgba(79,70,229,0.08)',
                  borderColor: selIsClubOwner ? 'rgba(245,158,11,0.45)' : 'rgba(79,70,229,0.45)',
                }}
              >
                <span className="arq-notice__eyebrow" style={{ color: selIsClubOwner ? '#F59E0B' : '#4F46E5' }}>
                  <span className="arq-notice__dot" style={{ background: selIsClubOwner ? '#F59E0B' : '#4F46E5', boxShadow: `0 0 10px ${selIsClubOwner ? '#F59E0B' : '#4F46E5'}` }} />
                  Provisioning Notice
                </span>
                <p className="arq-notice__text">
                  {selIsClubOwner
                    ? `Approving a Club Owner will automatically provision their club record — ${sel.club} — assign a league slot and unlock Squad and Review Queue for this account. Proceed?`
                    : `Approving a Platform Evaluator adds ${sel.name} to the baseline assessment pool. Unassigned players can be routed to them immediately. Proceed?`}
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
