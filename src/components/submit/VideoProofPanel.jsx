// Video-proof drop zone. Presentational for now — matches the design canvas
// framing (corner brackets, play button, clip stamp). Wiring a real file
// picker / upload lands with the submissions API.
export function VideoProofPanel({ sessionLine }) {
  return (
    <>
      <div className="sp-drop__head">
        <span className="sp-drop__eyebrow">Video Proof</span>
        <span className="sp-drop__session">{sessionLine}</span>
      </div>

      <div className="sp-drop__zone">
        <span className="sp-drop__dashed" />
        <span className="sp-drop__corner sp-drop__corner--tl" />
        <span className="sp-drop__corner sp-drop__corner--tr" />
        <span className="sp-drop__corner sp-drop__corner--bl" />
        <span className="sp-drop__corner sp-drop__corner--br" />

        <button type="button" className="sp-drop__cta">
          <span className="sp-drop__play">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#FF2E63">
              <path d="M8 5l12 7-12 7z" />
            </svg>
          </span>
          <span className="sp-drop__cta-text">
            <span className="sp-drop__cta-title">Drop training clip or browse</span>
            <span className="sp-drop__cta-hint">
              MP4 or MOV · max 90 seconds · single unbroken take
            </span>
          </span>
        </button>

        <span className="sp-drop__stamp">00:47</span>
      </div>
    </>
  )
}
