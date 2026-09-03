// The FIFA-style card on the left of the dashboard header: big OVR, position
// code, name, status badges and the physical mini-grid.
export function PlayerIdentityCard({
  playerName,
  overall,
  positionCode,
  positionLabel,
  height,
  weight,
  footCode,
}) {
  return (
    <div className="dash-fifa">
      <div className="dash-fifa__head">
        <span className="dash-fifa__ovr">
          <span className="dash-fifa__ovr-value">{overall}</span>
          <span className="dash-fifa__ovr-label">OVR</span>
        </span>
        <span className="dash-fifa__poscode">{positionCode}</span>
      </div>

      <div className="dash-fifa__body">
        <span className="dash-fifa__name">{playerName}</span>
        <div className="dash-fifa__badges">
          <span className="dash-fifa__badge dash-fifa__badge--pos">{positionLabel}</span>
          <span className="dash-fifa__badge dash-fifa__badge--club">No Club</span>
        </div>
        <div className="dash-fifa__physical">
          <span className="dash-fifa__phys">
            <span className="dash-fifa__phys-label">Height</span>
            <span className="dash-fifa__phys-value">
              {height}
              <span className="dash-fifa__phys-unit"> cm</span>
            </span>
          </span>
          <span className="dash-fifa__phys">
            <span className="dash-fifa__phys-label">Weight</span>
            <span className="dash-fifa__phys-value">
              {weight}
              <span className="dash-fifa__phys-unit"> kg</span>
            </span>
          </span>
          <span className="dash-fifa__phys">
            <span className="dash-fifa__phys-label">Foot</span>
            <span className="dash-fifa__phys-value">{footCode}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
