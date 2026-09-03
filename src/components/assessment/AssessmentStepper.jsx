// The four-step progress rail shown above the assessment form.
// `steps` comes straight from usePlayerAssessment(): { num, label, status }.
export function AssessmentStepper({ steps }) {
  return (
    <div className="asm-stepper">
      {steps.map((step) => (
        <div key={step.num} className={`asm-stepper__item is-${step.status}`}>
          <span className="asm-stepper__num">{step.num}</span>
          <span className="asm-stepper__label">{step.label}</span>
        </div>
      ))}
    </div>
  )
}
