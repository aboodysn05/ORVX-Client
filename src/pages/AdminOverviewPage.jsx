import { useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import { useAuth } from '../hooks/useAuth'
import { cardName, initials } from '../utils/playerCard'
import '../styles/admin-overview.css'

// Sys-Admin Overview & Profile — translated from OVRX Admin Profile.dc.html.
// Frontend only: mock security/impact/log data, local state for the
// notification toggles and a transient toast.

const IMPACT = [
  { label: 'Coaches Approved', value: '42', note: '6 pending in the requests queue', color: '#10B981', pct: 78 },
  { label: 'Positions Unlocked', value: '18', note: 'Baseline re-assessments granted', color: '#A5B0FF', pct: 44 },
  { label: 'Uptime On Shift', value: '4h 12m', note: 'Signed in 08:41 UTC · no idle breaks', color: '#FF2E63', pct: 62 },
]

const PREFS = [
  { key: 'stuck', label: 'Email me for stuck submissions (>48h)', on: 'Digest at 08:00 UTC', off: 'No alert sent' },
  { key: 'coaches', label: 'Notify on new coach registrations', on: 'Instant email', off: 'No alert sent' },
  { key: 'capacity', label: 'Alert when clubs hit capacity', on: 'Instant email', off: 'Muted' },
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
  const [prefs, setPrefs] = useState({ stuck: true, coaches: true, capacity: false })
  const [toast, setToast] = useState('')

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  function togglePref(p) {
    const active = prefs[p.key]
    setPrefs((prev) => ({ ...prev, [p.key]: !prev[p.key] }))
    fire(`${active ? 'Muted: ' : 'Enabled: '}${p.label}`)
  }

  const onCount = PREFS.filter((p) => prefs[p.key]).length

  return (
    <AdminShell footerNote="OVRX Admin Console · Profile & Settings" footerRight="Credential changes require 2FA re-entry">
      <section className="adm-section">
        <div className="adm-herocopy">
          <span className="adm-kicker">Account · Session · Personal Log</span>
          <h1 className="adm-title">Administrator Overview &amp; Profile</h1>
          <p className="adm-lead">
            Manage your root access credentials, security settings, and view your personal system
            operations log.
          </p>
        </div>
      </section>

      <section className="adm-section aov-cards">
        <div className="aov-card">
          <span className="aov-card__k">Identity</span>
          <div className="aov-identity">
            <span className="aov-identity__avatar">{initials(user?.name) || 'AD'}</span>
            <span className="aov-identity__id">
              <span className="aov-identity__name">{cardName(user?.name)}</span>
              <span className="aov-mono aov-identity__email">{user?.email || 'a.duarte@ovrx.app'}</span>
              <span className="aov-rootbadge">
                <span className="aov-rootbadge__dot" />
                Root Access
              </span>
            </span>
          </div>
          <div className="aov-idgrid">
            <span className="aov-idcell">
              <span className="aov-idcell__k">Admin ID</span>
              <span className="aov-mono aov-idcell__v">Admin_01</span>
            </span>
            <span className="aov-idcell">
              <span className="aov-idcell__k">Member Since</span>
              <span className="aov-mono aov-idcell__v">2025-03-11</span>
            </span>
          </div>
        </div>

        <div className="aov-card">
          <span className="aov-card__k">Security Status</span>
          <div className="aov-2fa">
            <span className="aov-2fa__id">
              <span className="aov-2fa__title">Two-Factor Auth</span>
              <span className="aov-mono aov-2fa__sub">Authenticator app · TOTP</span>
            </span>
            <span className="aov-2fa__badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" />
              </svg>
              Enabled
            </span>
          </div>
          <div className="aov-lastlogin">
            <span className="aov-lastlogin__k">Last Login</span>
            <span className="aov-mono aov-lastlogin__ts">2026-08-31 08:41:07 UTC</span>
            <span className="aov-mono aov-lastlogin__meta">
              <span>IP 192.168.1.1</span>
              <span>Lisbon, PT</span>
            </span>
          </div>
          <div className="aov-pw">
            <button
              type="button"
              className="aov-pw__btn"
              onClick={() => fire('Password rotation sent to a.duarte@ovrx.systems')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="10" width="16" height="10" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Update Password
            </button>
            <span className="aov-mono aov-pw__note">Rotated 46 days ago · policy 90 days</span>
          </div>
        </div>

        <div className="aov-card">
          <span className="aov-card__head">
            <span className="aov-card__k">Admin Impact</span>
            <span className="aov-mono aov-card__meta">Season to date</span>
          </span>
          {IMPACT.map((i) => (
            <div key={i.label} className="aov-impact" style={{ borderLeftColor: i.color }}>
              <span className="aov-impact__row">
                <span className="aov-impact__k">{i.label}</span>
                <span className="aov-impact__v" style={{ color: i.color }}>
                  {i.value}
                </span>
              </span>
              <span className="aov-impact__bar">
                <span
                  className="aov-impact__fill"
                  style={{ width: `${i.pct}%`, background: i.color, boxShadow: `0 0 12px ${i.color}` }}
                />
              </span>
              <span className="aov-mono aov-impact__note">{i.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="adm-section">
        <div className="aov-prefs">
          <div className="aov-prefs__intro">
            <span className="aov-card__k">Notification Preferences</span>
            <span className="aov-prefs__title">System Alerts &amp; Routing</span>
            <span className="aov-mono aov-prefs__summary">
              {onCount} of {PREFS.length} routes active. Critical security events always email,
              regardless of these settings.
            </span>
          </div>
          <div className="aov-prefs__list">
            {PREFS.map((p) => {
              const active = prefs[p.key]
              return (
                <button
                  key={p.key}
                  type="button"
                  className={`aov-pref ${active ? 'is-on' : ''}`}
                  onClick={() => togglePref(p)}
                >
                  <span className="aov-pref__text">
                    <span className="aov-pref__label">{p.label}</span>
                    <span className={`aov-mono aov-pref__note ${active ? 'is-on' : ''}`}>
                      {active ? p.on : p.off}
                    </span>
                  </span>
                  <span className={`adm-toggle ${active ? 'is-on' : ''}`}>
                    <span className="adm-toggle__knob" />
                  </span>
                </button>
              )
            })}
          </div>
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
          <span className="aov-mono aov-log-head__uptime">
            <span className="aov-log-head__dot" />
            Session uptime 4h 12m
          </span>
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
                  <span
                    className="aov-mono aov-term__action"
                    style={{ color: ACTION_COLOR[r.kind] }}
                  >
                    {r.action}
                  </span>
                  <span className="aov-mono aov-term__target">{r.target}</span>
                  <span className="adm-tc--right">
                    <span className={`adm-pill adm-pill--${STATUS_TONE[r.status]} aov-mono`}>
                      {r.status}
                    </span>
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
