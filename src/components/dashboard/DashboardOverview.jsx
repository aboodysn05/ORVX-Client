import { Link } from 'react-router-dom'

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

// Section 1, right column: the free-agent identity banner plus the three
// headline stat tiles.
export function DashboardOverview({
  playerName,
  playerId,
  initials,
  positionLabel,
  drillsDone,
  approved,
  totalSessions,
  applicationsNote,
}) {
  const tiles = [
    { label: 'Drills Completed', value: drillsDone, note: 'Logged all-time' },
    {
      label: 'Baseline Sessions',
      value: (
        <>
          {approved}
          <span className="dash-tile__sub"> / {totalSessions}</span>
        </>
      ),
      note: 'Approved & counted',
    },
    { label: 'Club Applications', value: 0, note: applicationsNote },
  ]

  return (
    <div className="dash-overview">
      <div className="dash-identity">
        <div className="dash-identity__top">
          <span className="dash-identity__avatar">{initials}</span>
          <div className="dash-identity__who">
            <span className="dash-identity__name">{playerName}</span>
            <span className="dash-identity__meta">Player ID {playerId}</span>
          </div>
          <span className="dash-identity__status">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.4">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Free Agent / Unassigned
          </span>
        </div>

        <div className="dash-identity__foot">
          <span className="dash-identity__foot-label">Registered Position</span>
          <span className="dash-identity__pos">
            {positionLabel}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C89A2" strokeWidth="2.4">
              <rect x="4" y="11" width="16" height="10" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <span className="dash-identity__note">
            Locked at registration. Only your club&apos;s head coach can change it — unavailable while
            you are a free agent.
          </span>
          <Link to="/train" className="dash-identity__cta">
            <BoltIcon />
            Create Training Session
          </Link>
        </div>
      </div>

      <div className="dash-tiles">
        {tiles.map((tile) => (
          <div key={tile.label} className="dash-tile">
            <span className="dash-tile__label">{tile.label}</span>
            <span className="dash-tile__value">{tile.value}</span>
            <span className="dash-tile__note">{tile.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
