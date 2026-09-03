// A single 0–100 self-rating slider. The native range input is transparent and
// sits on top of the styled rail / fill / thumb; the fill and thumb are
// positioned from the `--val` custom property so no per-render inline geometry
// is needed beyond that one number.
export function AttributeSlider({ label, question, value, onChange }) {
  return (
    <div className="asm-slider">
      <div className="asm-slider__head">
        <span className="asm-slider__question">{question}</span>
        <span className="asm-slider__value">{value}</span>
      </div>

      <div className="asm-slider__track" style={{ '--val': value }}>
        <span className="asm-slider__rail" />
        <span className="asm-slider__fill" />
        <span className="asm-slider__thumb" />
        <input
          className="asm-slider__input"
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
        />
      </div>

      <div className="asm-slider__scale">
        <span>{label}</span>
        <span>0 — 100</span>
      </div>
    </div>
  )
}
