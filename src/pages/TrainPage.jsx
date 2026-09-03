import { useNavigate } from 'react-router-dom'
import { useSessionBuilder } from '../hooks/useSessionBuilder'
import { PlayerNav } from '../components/layout/PlayerNav'
import { SiteFooter } from '../components/layout/SiteFooter'
import '../styles/train.css'

function Stepper({ label, value, onDec, onInc }) {
  return (
    <div className="sb-stepper">
      <span className="sb-stepper__label">{label}</span>
      <div className="sb-stepper__box">
        <button type="button" className="sb-stepper__btn" onClick={onDec} aria-label={`Decrease ${label}`}>
          −
        </button>
        <span className="sb-stepper__value">{value}</span>
        <button type="button" className="sb-stepper__btn" onClick={onInc} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

function PlaylistItem({ item }) {
  return (
    <div className="sb-item">
      <span className="sb-item__rail">
        <span className="sb-item__pos">{item.pos}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#4A5670" aria-hidden="true">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </span>

      <div className="sb-item__body">
        <div className="sb-item__info">
          <span className="sb-item__name">{item.name}</span>
          <div className="sb-item__meta">
            {item.tags.map((tag) => (
              <span key={tag} className="sb-tag">
                {tag}
              </span>
            ))}
            <span className="sb-item__unit">{item.unitText}</span>
          </div>
        </div>

        <div className="sb-item__controls">
          <Stepper label="Sets" value={item.sets} onDec={item.decSets} onInc={item.incSets} />
          <Stepper label={item.repLabel} value={item.reps} onDec={item.decReps} onInc={item.incReps} />
          <div className="sb-item__time">
            <span className="sb-item__time-label">Time</span>
            <span className="sb-item__time-value">{item.timeLabel}</span>
          </div>
          <button
            type="button"
            className="sb-item__remove"
            onClick={item.remove}
            aria-label={`Remove ${item.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function CatalogCard({ drill }) {
  return (
    <div className="sb-cat-card">
      <div className="sb-cat-card__info">
        <span className="sb-cat-card__name">{drill.name}</span>
        <div className="sb-cat-card__tags">
          {drill.tags.map((tag) => (
            <span key={tag} className="sb-cat-tag">
              {tag}
            </span>
          ))}
          <span className="sb-cat-card__meta">{drill.metaText}</span>
        </div>
      </div>

      {drill.inSession ? (
        <span className="sb-cat-card__in">
          In Session
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </span>
      ) : (
        <button type="button" className="sb-cat-card__add" onClick={drill.add}>
          + Add to Session
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Session Builder — the player assembles drills into a training session,
// tunes sets/reps, and starts recording. All state is local (see
// useSessionBuilder); "Start & Record" stashes the session draft.
export function TrainPage() {
  const navigate = useNavigate()
  const sb = useSessionBuilder()

  function handleStart() {
    try {
      localStorage.setItem('orvx_session', JSON.stringify(sb.buildHandoff()))
    } catch {
      // storage unavailable — the draft just isn't kept
    }
    navigate('/workout')
  }

  return (
    <div className="sb">
      <div className="sb__grid" />
      <div className="sb__glow-a" />
      <div className="sb__glow-b" />

      <PlayerNav />

      <section className="sb-head">
        <span className="sb-head__badge">
          <span className="sb-head__badge-dot" />
          Session Builder
        </span>
        <h1 className="sb-head__title">Build Custom Training Session</h1>
        <p className="sb-head__lead">
          Assemble drills to target your focus attributes, track session time, and prepare for coach
          submission.
        </p>

        <div className="sb-config">
          <label className="sb-field sb-field--name">
            <span className="sb-field__label">Session Name</span>
            <input
              className="sb-input"
              type="text"
              value={sb.sessionName}
              onChange={(event) => sb.setSessionName(event.target.value)}
            />
          </label>
          <label className="sb-field">
            <span className="sb-field__label">Target Primary Focus</span>
            <span className="sb-select__wrap">
              <select
                className="sb-select"
                value={sb.focus}
                onChange={(event) => sb.setFocus(event.target.value)}
              >
                {sb.focusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <svg
                className="sb-select__arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5A6784"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </label>
        </div>
      </section>

      <section className="sb-main">
        <div className="sb-left">
          <div className="sb-summary">
            <div className="sb-summary__stats">
              <div className="sb-summary__stat">
                <span className="sb-summary__stat-label">Est. Time</span>
                <span className="sb-summary__value">
                  {sb.totalTime}
                  <span className="sb-summary__unit"> MINS</span>
                </span>
              </div>
              <span className="sb-summary__divider" />
              <div className="sb-summary__stat">
                <span className="sb-summary__stat-label">Exercises</span>
                <span className="sb-summary__value">
                  {sb.count}
                  <span className="sb-summary__unit"> DRILLS</span>
                </span>
              </div>
            </div>
            <div className="sb-summary__xp">
              <span className="sb-summary__xp-label">Projected XP Boost</span>
              <div className="sb-summary__xp-pills">
                {sb.gains.length ? (
                  sb.gains.map((gain) => (
                    <span key={gain} className="sb-xp-pill">
                      {gain}
                    </span>
                  ))
                ) : (
                  <span className="sb-xp-pill sb-xp-pill--muted">None yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="sb-playlist-head">
            <h2 className="sb-playlist-head__title">Active Session Playlist</h2>
            <span className="sb-playlist-head__hint">Order top to bottom</span>
          </div>

          {sb.isEmpty ? (
            <div className="sb-empty">
              <span className="sb-empty__title">Canvas is empty.</span>
              <span className="sb-empty__note">
                Add drills from the catalog on the right to start building the session.
              </span>
            </div>
          ) : (
            sb.playlist.map((item) => <PlaylistItem key={item.uid} item={item} />)
          )}
        </div>

        <aside className="sb-catalog">
          <div className="sb-catalog__head">
            <h2 className="sb-catalog__title">Quick-Add Catalog</h2>
            <span className="sb-catalog__count">{sb.catalogCount} Found</span>
          </div>

          <div className="sb-search">
            <svg
              className="sb-search__icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5A6784"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5L21 21" />
            </svg>
            <input
              className="sb-search__input"
              type="text"
              placeholder="Search drills to add..."
              value={sb.query}
              onChange={(event) => sb.setQuery(event.target.value)}
            />
          </div>

          <div className="sb-filters">
            {sb.pills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={`sb-filter ${pill.active ? 'is-active' : ''}`}
                onClick={() => sb.toggleFilter(pill.key)}
              >
                {pill.key}
              </button>
            ))}
          </div>

          <span className="sb-catalog__divider" />

          <div className="sb-catalog__list">
            {sb.catalog.map((drill) => (
              <CatalogCard key={drill.id} drill={drill} />
            ))}
            {sb.noResults && (
              <span className="sb-catalog__empty">No drills match that search or filter.</span>
            )}
          </div>
        </aside>
      </section>

      <SiteFooter />

      <div className="sb-bar">
        <div className="sb-bar__gains">
          <span className="sb-bar__gains-label">Projected Gains</span>
          <span className="sb-bar__gains-value">{sb.gainsLine}</span>
        </div>
        <div className="sb-bar__right">
          <span className="sb-bar__session">
            <span className="sb-bar__session-label">Session</span>
            <span className="sb-bar__session-value">
              {sb.count} Drills · {sb.totalTime} Mins
            </span>
          </span>
          <button
            type="button"
            className="sb-bar__start"
            onClick={handleStart}
            disabled={sb.isEmpty}
          >
            Start &amp; Record Session
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4l13 8-13 8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
