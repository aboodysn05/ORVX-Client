import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { useAuth } from '../hooks/useAuth'
import { cardName, initials } from '../utils/playerCard'
import '../styles/admin-overview.css'

// Sys-Admin Overview — the admin console landing page. Frontend only:
// mock snapshot counters, a mock append-only action log, a transient toast.

const BANNER_META = [
  { k: 'Admin ID', v: 'Admin_01' },
  { k: 'Member Since', v: '2025-03-11' },
  { k: 'Last Login', v: '2026-08-31 08:41 UTC' },
  { k: 'Session Uptime', v: '4h 12m' },
]

// Actionable snapshot — each tile deep-links into the section that owns it.
const SNAPSHOT = [
  { label: 'Pending Coach Requests', value: '6', note: 'Oldest waiting 4 days', to: '/admin/requests', color: '#F59E0B', cta: 'Review queue' },
  { label: 'Clubs Near Capacity', value: '3', note: '2 already at the cap', to: '/admin/clubs', color: '#FF2E63', cta: 'Manage clubs' },
  { label: 'Results Outstanding', value: '4', note: 'Season 1 · Division A', to: '/admin/leagues', color: '#4F46E5', cta: 'Enter results' },
  { label: 'Active Drills', value: '7', note: '2 retired this month', to: '/admin/drills', color: '#10B981', cta: 'Open catalogue' },
]

const SEASON = [
  { label: 'Coaches Approved', value: '42', note: 'Season to date' },
  { label: 'Positions Unlocked', value: '18', note: 'Baseline re-assessments' },
  { label: 'Clubs Provisioned', value: '11', note: '1 archived' },
]

const ACTION_COLOR = { Access: '#A5B0FF', Results: '#10B981', Catalogue: '#F59E0B', Session: '#6E7C96' }
const STATUS_TONE = { SUCCESS: 'green', PENDING: 'amber', REVERTED: 'pink' }

const LOG = [
  { ts: '14:32:11', action: 'APPROVED_COACH', target: 'Coach: Marcus (ID: 992)', status: 'SUCCESS', kind: 'Access' },
  { ts: '14:06:02', action: 'COMMITTED_RESULT', target: 'Fixture: VAN 2–1 NGR (MD5, S1-DivA)', status: 'SUCCESS', kind: 'Results' },
  { ts: '13:48:55', action: 'UNLOCKED_POSITION', target: 'Player: Jordan (ID: 8492)', status: 'SUCCESS', kind: 'Access' },
  { ts: '13:20:19', action: 'UPDATED_XP_WEIGHT', target: 'Drill: DRL-021 Sprint Ladder · +2 → +3', status: 'SUCCESS', kind: 'Catalogue' },
  { ts: '12:57:40', action: 'DECLINED_COACH_REQUEST', target: 'Coach: R. Salcedo · unverified club', status: 'SUCCESS', kind: 'Access' },
  { ts: '12:31:08', action: 'EDITED_CLUB_CAPACITY', target: 'Club: Kestrel Athletic · 22 → 26 slots', status: 'SUCCESS', kind: 'Access' },
  { ts: '11:59:33', action: 'REASSIGNED_EVALUATOR', target: 'Player: Sofia (ID: 6120) → M. Varga', status: 'SUCCESS', kind: 'Access' },
  { ts: '11:14:27', action: 'ARCHIVED_CLUB', target: 'Club: Halden Wanderers · 14 released', status: 'SUCCESS', kind: 'Access' },
  { ts: '10:52:06', action: 'RETIRED_DRILL', target: 'Drill: DRL-011 Long Range Curler', status: 'SUCCESS', kind: 'Catalogue' },
  { ts: '10:41:12', action: 'PROVISIONED_CLUB', target: 'Club: Vantage FC · owner L. Brennan', status: 'SUCCESS', kind: 'Access' },
  { ts: '10:18:44', action: 'RESET_2FA_DEVICE', target: 'Coach: D. Achebe (ID: 771)', status: 'PENDING', kind: 'Access' },
  { ts: '09:47:31', action: 'BULK_EXPORT_LOG', target: 'Range: 2026-08-01 → 2026-08-30', status: 'SUCCESS', kind: 'Results' },
  { ts: '09:12:58', action: 'AMENDED_RESULT', target: 'Fixture: KES 1–1 AUR · reopened', status: 'REVERTED', kind: 'Results' },
  { ts: '08:41:07', action: 'SESSION_START', target: 'IP 82.14.220.19 · Lisbon, PT', status: 'SUCCESS', kind: 'Session' },
]

export function AdminOverviewPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState('')

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  return (
    <AdminShell
      footerNote="OVRX Admin Console · Overview"
      footerRight="Every action is written to the append-only audit log"
    >
      <section className="adm-section">
        <div className="aov-banner">
          <span className="aov-banner__avatar">{initials(user?.name) || 'AD'}</span>
          <div className="aov-banner__id">
            <span className="aov-banner__kicker">
              <span className="aov-banner__pulse" />
              Signed in · Root Access
            </span>
            <h1 className="aov-banner__name">{cardName(user?.name) || 'A. Duarte'}</h1>
            <span className="aov-mono aov-banner__email">{user?.email || 'a.duarte@ovrx.app'}</span>
          </div>
          <div className="aov-banner__meta">
            {BANNER_META.map((m) => (
              <span key={m.k} className="aov-metacell">
                <span className="aov-metacell__k">{m.k}</span>
                <span className="aov-mono aov-metacell__v">{m.v}</span>
              </span>
            ))}
          </div>
        </div>
        <p className="aov-welcome">
          Everything below is live across the console. Jump straight to whatever needs a decision, then
          check your action trail at the bottom.
        </p>
      </section>

      <section className="adm-section">
        <div className="aov-sectionhead">
          <span className="aov-sectionhead__title">Needs Your Attention</span>
          <span className="aov-mono aov-sectionhead__meta">4 open items</span>
        </div>
        <div className="aov-snap">
          {SNAPSHOT.map((s) => (
            <Link key={s.label} to={s.to} className="aov-snapcard" style={{ '--c': s.color }}>
              <span className="aov-snapcard__top">
                <span className="aov-snapcard__label">{s.label}</span>
                <svg
                  className="aov-snapcard__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M6 18L18 6M9 6h9v9" />
                </svg>
              </span>
              <span className="aov-snapcard__value">{s.value}</span>
              <span className="aov-mono aov-snapcard__note">{s.note}</span>
              <span className="aov-snapcard__cta">{s.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="adm-section">
        <div className="aov-sectionhead">
          <span className="aov-sectionhead__title">Your Impact</span>
          <span className="aov-mono aov-sectionhead__meta">Season to date</span>
        </div>
        <div className="aov-season">
          {SEASON.map((s) => (
            <div key={s.label} className="aov-seasoncell">
              <span className="aov-seasoncell__v">{s.value}</span>
              <span className="aov-seasoncell__k">{s.label}</span>
              <span className="aov-mono aov-seasoncell__note">{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="adm-section aov-log-section">
        <div className="aov-log-head">
          <span className="aov-log-head__left">
            <span className="aov-log-head__title">Your Recent Actions</span>
            <span className="aov-log-head__badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <rect x="5" y="11" width="14" height="9" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Append-Only
            </span>
          </span>
          <button
            type="button"
            className="aov-log-head__export"
            onClick={() => fire('Audit export queued · emailed to you on completion')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Export Log
          </button>
        </div>

        <div className="aov-term">
          <div className="aov-term__bar">
            <span className="aov-mono aov-term__cmd">
              <span className="aov-term__prompt">ovrx@audit:~$</span> grep actor=Admin_01
              admin_actions.log
            </span>
            <span className="aov-mono aov-term__meta">{LOG.length} lines · today, newest first</span>
          </div>
          <div className="aov-term__scroll">
            <div className="aov-term__grid aov-term__grid--head">
              <span>Timestamp</span>
              <span>Action Taken</span>
              <span>Target Entity</span>
              <span className="adm-th--right">Status</span>
            </div>
            <div className="aov-term__rows">
              {LOG.map((r, i) => (
                <div key={i} className="aov-term__grid aov-term__row">
                  <span className="aov-mono aov-term__ts">{r.ts}</span>
                  <span className="aov-mono aov-term__action" style={{ color: ACTION_COLOR[r.kind] }}>
                    {r.action}
                  </span>
                  <span className="aov-mono aov-term__target">{r.target}</span>
                  <span className="adm-tc--right">
                    <span className={`adm-pill adm-pill--${STATUS_TONE[r.status]} aov-mono`}>{r.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="aov-term__foot">
            <span>Filtered to your admin ID · full log is system-wide</span>
            <span className="aov-term__ok">■ Integrity verified</span>
          </div>
        </div>
      </section>

      {toast && (
        <div className="adm-toast">
          <span className="adm-toast__dot" />
          <span className="adm-toast__msg aov-mono">{toast}</span>
        </div>
      )}
    </AdminShell>
  )
}
