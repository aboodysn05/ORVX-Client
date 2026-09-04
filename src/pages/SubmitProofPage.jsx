import { Link } from 'react-router-dom'
import { useSubmitProof } from '../hooks/useSubmitProof'
import { PlayerNav } from '../components/layout/PlayerNav'
import { SiteFooter } from '../components/layout/SiteFooter'
import { VideoProofPanel } from '../components/submit/VideoProofPanel'
import { ReviewerRouting } from '../components/submit/ReviewerRouting'
import { SubmissionSummary } from '../components/submit/SubmissionSummary'
import { SubmitSuccessModal } from '../components/submit/SubmitSuccessModal'
import '../styles/submit-proof.css'

// Submit Training Proof — a player attaches the clip from a finished session
// and routes it to a reviewer. Reached from the Active Workout screen once
// every set is ticked.
export function SubmitProofPage() {
  const sp = useSubmitProof()

  return (
    <div className="sp">
      <div className="sp__grid" />
      <div className="sp__glow-a" />
      <div className="sp__glow-b" />

      <PlayerNav />

      <section className="sp-head">
        <div className="sp-head__top">
          <div className="sp-head__titles">
            <span className="sp-head__crumbs">
              <Link to="/dashboard">Dashboard</Link>
              <span className="sp-head__crumb-sep">/</span>
              <Link to="/workout">Active Workout</Link>
              <span className="sp-head__crumb-sep">/</span>
              <span className="sp-head__crumb-here">Submit Proof</span>
            </span>
            <h1 className="sp-head__title">Submit Training Proof</h1>
            <p className="sp-head__note">{sp.headerNote}</p>
          </div>

          <div className="sp-toggle">
            <span className="sp-toggle__label">Approved sessions</span>
            <div className="sp-toggle__group">
              {sp.approvedSteps.map((step) => (
                <button
                  key={step.value}
                  type="button"
                  className={`sp-toggle__btn ${step.active ? 'is-active' : ''}`}
                  onClick={step.select}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sp-body">
        <div className="sp-main">
          <VideoProofPanel sessionLine={sp.sessionLine} />

          <ReviewerRouting
            baselineDone={sp.baselineDone}
            lockLabel={sp.lockLabel}
            coaches={sp.coaches}
            coach={sp.coach}
            onSelectCoach={sp.onSelectCoach}
            tipOpen={sp.tipOpen}
            tipOn={sp.tipOn}
            tipOff={sp.tipOff}
            tipToggle={sp.tipToggle}
          />

          <div className="sp-notes">
            <span className="sp-notes__label">
              Notes to reviewer <span>· optional</span>
            </span>
            <textarea
              className="sp-notes__field"
              rows={4}
              placeholder="Surface, weather, anything the reviewer should know…"
              value={sp.notes}
              onChange={sp.onNotesChange}
            />
          </div>

          <div className="sp-submit">
            <button type="button" className="sp-submit__btn" onClick={sp.submit}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
              </svg>
              Submit Session for Review
            </button>
            <span className="sp-submit__note">{sp.submitNote}</span>
          </div>
        </div>

        <div className="sp-side">
          <SubmissionSummary summary={sp.summary} routingNote={sp.routingNote} />
        </div>
      </section>

      <SiteFooter />

      {sp.successOpen && (
        <SubmitSuccessModal
          title={sp.successTitle}
          body={sp.successBody}
          onClose={sp.closeSuccess}
        />
      )}
    </div>
  )
}
