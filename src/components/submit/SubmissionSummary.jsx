import { Link } from 'react-router-dom'

// Right rail: a read-only recap of what is about to be sent, plus the routing
// rule that explains why the reviewer is locked or open.
export function SubmissionSummary({ summary, routingNote }) {
  return (
    <>
      <div className="sp-summary">
        <span className="sp-summary__eyebrow">This Submission</span>
        {summary.map((row) => (
          <div key={row.k} className="sp-summary__row">
            <span className="sp-summary__k">{row.k}</span>
            <span className="sp-summary__v" style={{ color: row.color }}>
              {row.v}
            </span>
          </div>
        ))}
      </div>

      <div className="sp-routing">
        <span className="sp-routing__eyebrow">Routing rule</span>
        <span className="sp-routing__note">{routingNote}</span>
        <Link to="/dashboard" className="sp-routing__link">
          Baseline tracker on Dashboard →
        </Link>
      </div>
    </>
  )
}
