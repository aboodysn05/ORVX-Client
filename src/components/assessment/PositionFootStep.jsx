import { POSITIONS, FEET } from '../../hooks/usePlayerAssessment'

// Step 1 — preferred position, dominant foot, height and weight.
export function PositionFootStep({
  position,
  onPositionChange,
  foot,
  onFootChange,
  height,
  onHeightChange,
  weight,
  onWeightChange,
}) {
  return (
    <div className="asm-step">
      <div className="asm-field">
        <span className="asm-field__label">Preferred Position</span>
        <div className="asm-chips">
          {POSITIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`asm-chip ${option === position ? 'is-active' : ''}`}
              onClick={() => onPositionChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="asm-field-row">
        <label className="asm-field">
          <span className="asm-field__label">Height (cm)</span>
          <input
            className="asm-input"
            type="number"
            min="120"
            max="220"
            value={height}
            onChange={(event) => onHeightChange(Number(event.target.value) || 0)}
          />
        </label>
        <label className="asm-field">
          <span className="asm-field__label">Weight (kg)</span>
          <input
            className="asm-input"
            type="number"
            min="30"
            max="150"
            value={weight}
            onChange={(event) => onWeightChange(Number(event.target.value) || 0)}
          />
        </label>
      </div>

      <div className="asm-field">
        <span className="asm-field__label">Dominant Foot</span>
        <div className="asm-chips">
          {FEET.map((option) => (
            <button
              key={option}
              type="button"
              className={`asm-chip ${option === foot ? 'is-active' : ''}`}
              onClick={() => onFootChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
