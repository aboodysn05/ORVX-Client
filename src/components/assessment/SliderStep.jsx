import { AttributeSlider } from './AttributeSlider'

// Steps 2 and 3 — a list of AttributeSliders for the attributes the wizard
// asks about on the current step. `sliders` comes from
// usePlayerAssessment().activeSliders.
export function SliderStep({ sliders }) {
  return (
    <div className="asm-step asm-step--sliders">
      {sliders.map((slider) => (
        <AttributeSlider
          key={slider.key}
          label={slider.label}
          question={slider.question}
          value={slider.value}
          onChange={slider.setValue}
        />
      ))}
    </div>
  )
}
