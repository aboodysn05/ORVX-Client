import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePlayerDashboard } from '../hooks/usePlayerDashboard'
import { getMyProfile } from '../api/players'
import { cardName, initials, playerId } from '../utils/playerCard'
import { PlayerNav } from '../components/layout/PlayerNav'
import { PlayerIdentityCard } from '../components/dashboard/PlayerIdentityCard'
import { DashboardOverview } from '../components/dashboard/DashboardOverview'
import { EligibilityPanel } from '../components/dashboard/EligibilityPanel'
import { CoachColumn } from '../components/dashboard/CoachColumn'
import { AttributesPanel } from '../components/dashboard/AttributesPanel'
import { ClubApplicationHub } from '../components/dashboard/ClubApplicationHub'
import { SiteFooter } from '../components/layout/SiteFooter'
import '../styles/dashboard.css'

// The signed-in player's home screen. Reads the card the assessment produced;
// a player who has not completed the assessment is sent there first.
export function PlayerDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  // 'loading' | 'ready' | 'missing' (no assessment yet, 404) | 'error' (network/server)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus(err.response?.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dash = usePlayerDashboard(profile, user?.email)

  if (status === 'loading') {
    return <div className="dash">Loading your dashboard…</div>
  }
  if (status === 'missing') {
    return <Navigate to="/assessment" replace />
  }
  if (status === 'error') {
    return (
      <div className="dash">
        Couldn't load your profile — check your connection and{' '}
        <button type="button" onClick={() => window.location.reload()}>
          try again
        </button>
        .
      </div>
    )
  }

  const name = cardName(user?.name)
  const player = {
    name,
    positionLabel: dash.positionLabel,
    overall: dash.overall,
    height: dash.height,
    weight: dash.weight,
    topAttrs: `${dash.attrs[0].code} ${dash.attrs[0].value} · ${dash.attrs[1].code} ${dash.attrs[1].value}`,
  }

  return (
    <div className="dash">
      <div className="dash__grid" />
      <div className="dash__glow-a" />
      <div className="dash__glow-b" />

      <PlayerNav />

      <section className="dash__row dash__row--header">
        <PlayerIdentityCard
          playerName={name}
          overall={dash.overall}
          positionCode={dash.positionCode}
          positionLabel={dash.positionLabel}
          height={dash.height}
          weight={dash.weight}
          footCode={dash.footCode}
        />
        <DashboardOverview
          playerName={name}
          playerId={playerId(user?.email)}
          initials={initials(user?.name)}
          positionLabel={dash.positionLabel}
          drillsDone={dash.drillsDone}
          approved={dash.approved}
          totalSessions={dash.totalSessions}
          applicationsNote={dash.applicationsNote}
        />
      </section>

      <section className="dash__row">
        <EligibilityPanel
          approved={dash.approved}
          totalSessions={dash.totalSessions}
          remaining={dash.remaining}
          meter={dash.meter}
          meterColor={dash.meterColor}
          milestones={dash.milestones}
          locked={dash.locked}
          lockedLabel={dash.lockedLabel}
          onOpenHub={dash.openHub}
          onSetApproved={dash.setApproved}
        />
        <CoachColumn submissions={dash.submissions} />
      </section>

      <AttributesPanel
        height={dash.height}
        weight={dash.weight}
        attrSetLabel={dash.attrSetLabel}
        verifyNote={dash.verifyNote}
        attrs={dash.attrs}
        radarPoints={dash.radarPoints}
        radarLabels={dash.radarLabels}
      />

      <SiteFooter />

      <ClubApplicationHub
        open={dash.hubOpen}
        clubs={dash.clubs}
        selectedClub={dash.selectedClub}
        chosen={dash.chosen}
        onSelectClub={dash.selectClub}
        onConfirm={dash.confirmSend}
        onClose={dash.closeHub}
        sentOpen={dash.sentOpen}
        onCloseSent={dash.closeSent}
        onBackToHub={dash.backToHub}
        player={player}
      />
    </div>
  )
}
