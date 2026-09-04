import { useEffect } from 'react'
import { Link } from 'react-router-dom'

// Confirmation overlay shown after a session is sent for review.
export function SubmitSuccessModal({ title, body, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sp-success" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sp-success__panel" onClick={(event) => event.stopPropagation()}>
        <span className="sp-success__icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22E07E" strokeWidth="2.6">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </span>
        <span className="sp-success__title">{title}</span>
        <p className="sp-success__body">{body}</p>
        <div className="sp-success__actions">
          <button type="button" className="sp-success__done" onClick={onClose}>
            Done
          </button>
          <Link to="/dashboard" className="sp-success__link">
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
