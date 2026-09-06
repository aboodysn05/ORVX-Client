import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import { listCoachApplications, approveCoachApplication, declineCoachApplication } from '../api/admin'
import '../styles/admin-requests.css'

// Admin Club-Management Approval Queue — live from GET /admin/coach-applications.
// Approving provisions a club slot and links the applicant as its head coach
// (backend/src/services/coaches.service.js approveCoachApplication).

const FILTERS = ['pending', 'approved', 'declined', 'all']
const FILTER_LABEL = { pending: 'Pending', approved: 'Approved', declined: 'Declined', all: 'All' }
const STATUS_TONE = { approved: 'green', declined: 'pink', pending: 'amber' }

function initialsOf(name) {
  const p = (name || '').trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'
}
function daysAgo(iso) {
  return iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000)) : 0
}
function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}
function checksFor(a) {
  return [
    { label: 'Licence number provided', ok: Boolean(a.licenseNumber) },
    { label: 'Credential document attached', ok: Boolean(a.credentialDocUrl) },
    { label: 'Club crest attached', ok: Boolean(a.clubLogoUrl) },
  ]
}

export function AdminRequestsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const fire = (msg) => {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2800)
  }

  const load = useCallback(() => {
    setLoading(true)
    listCoachApplications()
      .then((rows) => {
        setApps(rows)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load coach applications.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (!selectedId) return undefined
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  const counts = useMemo(() => {
    const pending = apps.filter((a) => a.status === 'pending')
    return {
      pending: pending.length,
      approved: apps.filter((a) => a.status === 'approved').length,
      declined: apps.filter((a) => a.status === 'declined').length,
      all: apps.length,
      stale: pending.filter((a) => daysAgo(a.createdAt) >= 4).length,
      missingDocs: pending.filter((a) => checksFor(a).some((c) => !c.ok)).length,
    }
  }, [apps])

  const visible = apps.filter((a) => filter === 'all' || a.status === filter)
  const sel = apps.find((a) => a.id === selectedId) || null

  async function decide(id, action) {
    if (busy) return
    setBusy(true)
    try {
      if (action === 'approve') {
        const res = await approveCoachApplication(id)
        fire(`Approved · ${res.club.name} provisioned in slot ${res.club.slot}`)
      } else {
        await declineCoachApplication(id)
        fire('Application declined')
      }
      setSelectedId(null)
      load()
    } catch (err) {
      fire(err.response?.data?.message || 'That action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

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
              Every coach who submits the gateway form lands here. Approving a request claims a free
              club slot and links the applicant as its head coach. Platform Evaluators are assigned
              internally and never appear here.
            </p>
          </div>
          <div className="adm-counters">
            <span className="adm-counter adm-counter--amber">
              <span className="adm-counter__k">Pending Total</span>
              <span className="adm-counter__v">{counts.pending}</span>
            </span>
            <span className="adm-counter adm-counter--pink">
              <span className="adm-counter__k">Missing Docs</span>
              <span className="adm-counter__v">{counts.missingDocs}</span>
            </span>
            <span className="adm-counter adm-counter--indigo">
              <span className="adm-counter__k">Over 4 Days</span>
              <span className="adm-counter__v">{counts.stale}</span>
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
              {FILTER_LABEL[f]}
              <span className="arq-chipcount">{counts[f]}</span>
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

          {loading && <div className="adm-empty"><span className="adm-empty__note">Loading…</span></div>}
          {error && !loading && (
            <div className="adm-empty">
              <span className="adm-empty__title">Couldn't load</span>
              <span className="adm-empty__note">{error}</span>
            </div>
          )}

          {!loading && !error && visible.map((a) => {
            const stale = a.status === 'pending' && daysAgo(a.createdAt) >= 4
            const borderColor =
              a.status === 'approved' ? '#10B981' : a.status === 'declined' ? '#FF2E63' : 'transparent'
            return (
              <div
                key={a.id}
                className="adm-trow adm-trow--clickable arq-grid"
                style={{ borderLeft: `2px solid ${borderColor}` }}
                role="button"
                tabIndex={0}
                aria-label={`Open dossier for ${a.applicantName}, ${a.clubName}`}
                onClick={() => setSelectedId(a.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedId(a.id)
                  }
                }}
              >
                <span className="arq-applicant" data-label="Applicant">
                  <span className="adm-avatar">{initialsOf(a.applicantName)}</span>
                  <span className="arq-applicant__id">
                    <span className="arq-applicant__name">{a.applicantName}</span>
                    <span className="arq-applicant__email">{a.applicantEmail}</span>
                  </span>
                </span>

                <span className="arq-club" data-label="Target Club">
                  <span className="arq-club__name">{a.clubName}</span>
                  <span className="arq-club__tag is-new">New Club · cap {a.squadCapacity}</span>
                </span>

                <span className="arq-cred" data-label="Credentials">
                  <span className="arq-doc">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 3H6v18h12V7l-4-4z" />
                      <path d="M14 3v4h4" />
                    </svg>
                    {a.licenseNumber || 'No licence number'}
                  </span>
                  <span className="arq-cred__years">{a.yearsExperience} yrs experience</span>
                </span>

                <span className="arq-date" data-label="Submitted">
                  <span className="arq-date__d">{fmtDate(a.createdAt)}</span>
                  <span className={`arq-date__age ${stale ? 'is-stale' : ''}`}>
                    {daysAgo(a.createdAt)}d in queue
                  </span>
                </span>

                <span
                  className="arq-actions adm-tc--right"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {a.status === 'pending' ? (
                    <>
                      <button type="button" className="arq-act arq-act--approve" onClick={() => setSelectedId(a.id)}>
                        Review &amp; Approve
                      </button>
                      <button
                        type="button"
                        className="arq-act arq-act--decline"
                        disabled={busy}
                        onClick={() => decide(a.id, 'decline')}
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span className={`adm-pill adm-pill--${STATUS_TONE[a.status]}`}>
                      {FILTER_LABEL[a.status]}
                    </span>
                  )}
                </span>
              </div>
            )
          })}

          {!loading && !error && visible.length === 0 && (
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
          <aside className="adm-drawer__panel" role="dialog" aria-modal="true" aria-label={`${sel.applicantName} dossier`}>
            <div className="adm-drawer__head">
              <span>
                <span className="adm-drawer__eyebrow">Applicant Dossier</span>
                <span className="adm-drawer__title" style={{ display: 'block' }}>{sel.applicantName}</span>
                <span className="adm-drawer__sub" style={{ display: 'block' }}>
                  {sel.applicantEmail} · submitted {fmtDate(sel.createdAt)}
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
                  { k: 'Full Name', v: sel.fullName, color: '#fff' },
                  { k: 'Target Club', v: sel.clubName, color: '#fff' },
                  { k: 'Experience', v: `${sel.yearsExperience} yrs`, color: '#fff' },
                  {
                    k: 'Current Status',
                    v: FILTER_LABEL[sel.status],
                    color: sel.status === 'approved' ? '#10B981' : sel.status === 'declined' ? '#FF2E63' : '#F59E0B',
                  },
                ].map((f) => (
                  <span key={f.k} className="arq-fact">
                    <span className="arq-fact__k">{f.k}</span>
                    <span className="arq-fact__v" style={{ color: f.color }}>{f.v}</span>
                  </span>
                ))}
              </div>

              <div className="arq-block">
                <span className="arq-block__label">Credential Document</span>
                <p className="arq-statement">
                  {sel.credentialDocUrl
                    ? `Licence ${sel.licenseNumber || '(no number)'} — document on file.`
                    : `Licence ${sel.licenseNumber || '(no number)'} — no document attached.`}
                </p>
                {sel.credentialDocUrl && (
                  <a className="arq-openbtn" href={sel.credentialDocUrl} target="_blank" rel="noreferrer">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 3H6v18h12V7l-4-4z" />
                      <path d="M14 3v4h4" />
                    </svg>
                    Open credential document
                  </a>
                )}
              </div>

              <div className="arq-block">
                <span className="arq-block__label">Verification Checklist</span>
                {checksFor(sel).map((c) => (
                  <span key={c.label} className="arq-check">
                    <span
                      className="arq-check__box"
                      style={{ borderColor: c.ok ? '#10B981' : '#F59E0B', color: c.ok ? '#10B981' : '#F59E0B' }}
                    >
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

              {sel.status === 'pending' && (
                <div className="arq-notice">
                  <span className="arq-notice__eyebrow">
                    <span className="arq-notice__dot" />
                    Provisioning Notice
                  </span>
                  <p className="arq-notice__text">
                    Approving this request claims a free club slot for <strong>{sel.clubName}</strong> and
                    links {sel.applicantName} as its head coach. Proceed?
                  </p>
                  <span className="arq-notice__actions">
                    <button type="button" className="adm-btn adm-btn--green" disabled={busy} onClick={() => decide(sel.id, 'approve')}>
                      Proceed · Grant Access
                    </button>
                    <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={() => decide(sel.id, 'decline')}>
                      Decline Request
                    </button>
                    <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setSelectedId(null)}>
                      Cancel
                    </button>
                  </span>
                </div>
              )}
            </div>
          </aside>
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
