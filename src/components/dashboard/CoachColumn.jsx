import { Link } from 'react-router-dom'

// Section 2, right column: the assigned platform review coach plus a short
// list of the player's most recent drill submissions.
export function CoachColumn({ submissions }) {
  return (
    <div className="dash-coach-col">
      <div className="dash-coach">
        <span className="dash-coach__eyebrow">Assigned Review Coach</span>
        <div className="dash-coach__id">
          <span className="dash-coach__avatar">#9</span>
          <div className="dash-coach__who">
            <span className="dash-coach__name">Coach #9</span>
            <span className="dash-coach__role">Official Platform Evaluator</span>
          </div>
        </div>
        <p className="dash-coach__blurb">
          Your baseline training session is reviewed by the OVRX Platform Coach to establish your
          verified performance baseline.
        </p>
        <div className="dash-coach__tags">
          <span className="dash-coach__tag">Avg review 18h</span>
          <span className="dash-coach__tag dash-coach__tag--go">Accepting submissions</span>
        </div>
        <div className="dash-coach__foot">
          <span className="dash-coach__foot-note">Coach reassignment after baseline</span>
          <Link to="/drills" className="dash-coach__foot-link">
            Submit Proof →
          </Link>
        </div>
      </div>

      <h2 className="dash-subs__heading">Recent Drill Submissions</h2>
      {submissions.map((submission) => (
        <div key={submission.name} className="dash-sub">
          <div className="dash-sub__body">
            <span className="dash-sub__name">{submission.name}</span>
            <span className="dash-sub__meta">{submission.meta}</span>
          </div>
          <span className={`dash-sub__status is-${submission.state}`}>{submission.status}</span>
        </div>
      ))}
    </div>
  )
}
