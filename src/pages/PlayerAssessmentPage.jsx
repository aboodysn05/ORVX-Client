import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePlayerAssessment } from '../hooks/usePlayerAssessment'
import { submitAssessment } from '../api/players'
import { cardName } from '../utils/playerCard'
import { AssessmentStepper } from '../components/assessment/AssessmentStepper'
import { PositionFootStep } from '../components/assessment/PositionFootStep'
import { SliderStep } from '../components/assessment/SliderStep'
import { CardInitStep } from '../components/assessment/CardInitStep'
import { PlayerCardPreview } from '../components/assessment/PlayerCardPreview'
import '../styles/assessment.css'

// Player onboarding: a four-step self-assessment that initializes the starting
// player card. All state is local (see usePlayerAssessment); on completion the
// card is persisted through the front-end store and the player is dropped into
// their dashboard.
export function PlayerAssessmentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const assessment = usePlayerAssessment()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const {
    step,
    steps,
    stepCopy,
    isFirstStep,
    isLastStep,
    showNext,
    goNext,
    goBack,
    position,
    setPosition,
    foot,
    setFoot,
    height,
    setHeight,
    weight,
    setWeight,
    activeSliders,
    overall,
    tier,
    physique,
    positionCode,
    footCode,
    badges,
    buildPayload,
  } = assessment

  async function handleLockIn() {
    setSubmitError('')
    setSubmitting(true)
    try {
      await submitAssessment(buildPayload())
      navigate('/dashboard')
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Unable to save your assessment. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="asm">
      <div className="asm__grid" />
      <div className="asm__glow-a" />
      <div className="asm__glow-b" />

      <header className="asm__header">
        <Link to="/" className="asm__brand">
          <svg width="26" height="26" viewBox="0 0 46 46" fill="none">
            <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" />
            <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="5" strokeLinecap="square" opacity="0.5" />
            <path d="M39 4 L41 4 L41 42 L39 42" stroke="#4F46E5" strokeWidth="4" strokeLinecap="square" />
          </svg>
          <span className="asm__wordmark">OVRX</span>
        </Link>
        <span className="asm__header-tag">Player Evaluation · Onboarding</span>
      </header>

      <div className="asm__stepper-wrap">
        <AssessmentStepper steps={steps} />
      </div>

      <main className="asm__main">
        <section className="asm__panel">
          <span className="asm__kicker">{stepCopy.kicker}</span>
          <h1 className="asm__title">{stepCopy.title}</h1>
          <p className="asm__blurb">{stepCopy.blurb}</p>

          {step === 1 && (
            <PositionFootStep
              position={position}
              onPositionChange={setPosition}
              foot={foot}
              onFootChange={setFoot}
              height={height}
              onHeightChange={setHeight}
              weight={weight}
              onWeightChange={setWeight}
            />
          )}

          {(step === 2 || step === 3) && <SliderStep sliders={activeSliders} />}

          {step === 4 && (
            <CardInitStep
              position={position}
              foot={foot}
              physique={physique}
              overall={overall}
              tierName={tier.name}
            />
          )}

          <div className="asm__actions">
            <button
              type="button"
              className="asm__btn asm__btn--back"
              onClick={goBack}
              disabled={isFirstStep}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 12H5M11 6l-6 6 6 6" />
              </svg>
              Back
            </button>

            {showNext && (
              <button type="button" className="asm__btn asm__btn--next" onClick={goNext}>
                Next Question
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </button>
            )}

            {isLastStep && (
              <button
                type="button"
                className="asm__btn asm__btn--lock"
                onClick={handleLockIn}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Lock In My OVR & Join Platform'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>

          {submitError && (
            <span style={{ color: '#FF2E63', fontSize: '0.85rem', display: 'block', marginTop: '0.75rem' }}>
              {submitError}
            </span>
          )}
        </section>

        <aside className="asm__preview">
          <PlayerCardPreview
            playerName={cardName(user?.name)}
            overall={overall}
            tier={tier}
            positionCode={positionCode}
            footCode={footCode}
            physique={physique}
            badges={badges}
          />
        </aside>
      </main>
    </div>
  )
}
