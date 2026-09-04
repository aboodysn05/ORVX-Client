import { useRef, useState } from 'react'

// Video-proof upload. Click or drag a clip onto the zone; once attached it
// plays inline. No network yet — the file is held in memory (object URL) until
// the submissions API exists.
export function VideoProofPanel({
  sessionLine,
  hasClip,
  clipUrl,
  clipName,
  clipDurationLabel,
  clipError,
  acceptTypes,
  onPickFile,
  clearClip,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function openPicker() {
    inputRef.current?.click()
  }

  function handleInput(event) {
    const file = event.target.files?.[0]
    if (file) onPickFile(file)
    event.target.value = '' // allow re-selecting the same file
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onPickFile(file)
  }

  return (
    <>
      <div className="sp-drop__head">
        <span className="sp-drop__eyebrow">Video Proof</span>
        <span className="sp-drop__session">{sessionLine}</span>
      </div>

      <div
        className={`sp-drop__zone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="sp-drop__corner sp-drop__corner--tl" />
        <span className="sp-drop__corner sp-drop__corner--tr" />
        <span className="sp-drop__corner sp-drop__corner--bl" />
        <span className="sp-drop__corner sp-drop__corner--br" />

        <input
          ref={inputRef}
          type="file"
          className="sp-drop__input"
          accept={acceptTypes}
          onChange={handleInput}
        />

        {hasClip ? (
          <>
            <video className="sp-drop__video" src={clipUrl} controls preload="metadata" />
            <button type="button" className="sp-drop__replace" onClick={openPicker}>
              Replace clip
            </button>
            <button type="button" className="sp-drop__remove" onClick={clearClip} aria-label="Remove clip">
              ✕
            </button>
            {clipDurationLabel && <span className="sp-drop__stamp">{clipDurationLabel}</span>}
          </>
        ) : (
          <>
            <span className="sp-drop__dashed" />
            <button type="button" className="sp-drop__cta" onClick={openPicker}>
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
          </>
        )}
      </div>

      {hasClip && <span className="sp-drop__file">{clipName}</span>}
      {clipError && <span className="sp-drop__error">{clipError}</span>}
    </>
  )
}
