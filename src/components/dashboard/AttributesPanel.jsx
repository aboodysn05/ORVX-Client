import { Link } from 'react-router-dom'
import { RADAR_AXES, RADAR_CENTER, RADAR_RADIUS, RADAR_LABEL_GAP } from '../../utils/attributes'

const { x: CX, y: CY } = RADAR_CENTER
const RINGS = [0.5, 0.75, 1]

// A polygon that traces the six axes at the given radius.
function ringPoints(radius) {
  return RADAR_AXES.map(([ux, uy]) => `${(CX + ux * radius).toFixed(2)},${(CY + uy * radius).toFixed(2)}`).join(
    ' ',
  )
}

// Label anchor just outside the outer ring, with an anchor side chosen from
// the axis direction so the text sits clear of the grid.
function axisLabel(i) {
  const [ux, uy] = RADAR_AXES[i]
  const r = RADAR_RADIUS + RADAR_LABEL_GAP
  const x = CX + ux * r
  const y = CY + uy * r
  let anchor = 'middle'
  if (ux > 0.1) anchor = 'start'
  else if (ux < -0.1) anchor = 'end'
  return { x, y, anchor }
}

function AttributeRadar({ points, labels }) {
  return (
    <svg viewBox="-26 -12 352 324" className="dash-radar" role="img" aria-label="Attribute radar">
      {RINGS.map((scale, i) => (
        <polygon
          key={scale}
          points={ringPoints(RADAR_RADIUS * scale)}
          fill="none"
          stroke={i === RINGS.length - 1 ? 'rgba(79,70,229,0.45)' : 'rgba(148,163,184,0.16)'}
          strokeWidth={i === RINGS.length - 1 ? 1.5 : 1}
        />
      ))}
      {RADAR_AXES.map(([ux, uy], i) => (
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={CX + ux * RADAR_RADIUS}
          y2={CY + uy * RADAR_RADIUS}
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={points}
        fill="rgba(255,46,99,0.22)"
        stroke="#FF2E63"
        strokeWidth="2.2"
        className="dash-radar__data"
      />
      {labels.map((label, i) => {
        const { x, y, anchor } = axisLabel(i)
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="#8B97AF"
            fontFamily="Archivo, sans-serif"
            fontSize="11"
            fontWeight="900"
            letterSpacing="1.4"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// Section 3: profile summary chips, the attribute radar and the per-attribute
// progress bars.
export function AttributesPanel({
  height,
  weight,
  attrSetLabel,
  verifyNote,
  attrs,
  radarPoints,
  radarLabels,
}) {
  return (
    <section className="dash-attrs">
      <div className="dash-attrs__head">
        <h2 className="dash-attrs__heading">Profile Summary &amp; Attributes</h2>
        <div className="dash-attrs__chips">
          <span className="dash-chip">HT {height} cm</span>
          <span className="dash-chip">WT {weight} kg</span>
          <span className="dash-chip dash-chip--set">{attrSetLabel}</span>
          <span className="dash-attrs__verify">{verifyNote}</span>
        </div>
      </div>

      <div className="dash-attrs__grid">
        <AttributeRadar points={radarPoints} labels={radarLabels} />

        <div className="dash-attrs__bars">
          {attrs.map((attr) => (
            <div key={attr.key} className="dash-bar">
              <div className="dash-bar__head">
                <span className="dash-bar__id">
                  <span className="dash-bar__code">{attr.code}</span>
                  <span className="dash-bar__name">{attr.name}</span>
                </span>
                <span className="dash-bar__figures">
                  <span className="dash-bar__next">{attr.next}</span>
                  <span className="dash-bar__value">{attr.value}</span>
                </span>
              </div>
              <span className="dash-bar__track">
                <span
                  className="dash-bar__fill"
                  style={{ width: attr.pct, background: attr.fill, boxShadow: `0 0 14px ${attr.glow}` }}
                />
              </span>
            </div>
          ))}

          <Link to="/assessment" className="dash-attrs__cta">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
            </svg>
            Create Training Session
          </Link>
        </div>
      </div>
    </section>
  )
}
