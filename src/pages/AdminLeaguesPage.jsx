import { useMemo, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-leagues.css'

// Admin Competition Engine — translated from OVRX Admin Leagues.dc.html.
// Frontend only: mock fixture list, result entry, and a Live Standings
// preview that recomputes points / goal difference / form from whatever
// results the admin has committed this session. Standings are derived,
// never stored — same rule the backend follows.

const SEASONS = [
  { id: 's1a', label: 'Season 1 · Division A' },
  { id: 's1b', label: 'Season 1 · Division B' },
]

const CLUBS = {
  s1a: [
    { id: 'c1', name: 'Northgate FC' },
    { id: 'c2', name: 'Vale United' },
    { id: 'c3', name: 'Ironside AFC' },
    { id: 'c4', name: 'Harbour Rangers' },
  ],
  s1b: [
    { id: 'c5', name: 'Copperfield Town' },
    { id: 'c6', name: 'Marsh Lane FC' },
    { id: 'c7', name: 'Deacon Park' },
    { id: 'c8', name: 'Westford Athletic' },
  ],
}

const FIXTURES = {
  s1a: [
    { id: 'f1', round: 'Round 1', home: 'c1', away: 'c2', kickoff: 'Sat 06 Sep · 15:00' },
    { id: 'f2', round: 'Round 1', home: 'c3', away: 'c4', kickoff: 'Sat 06 Sep · 15:00' },
    { id: 'f3', round: 'Round 2', home: 'c2', away: 'c3', kickoff: 'Sat 13 Sep · 15:00' },
    { id: 'f4', round: 'Round 2', home: 'c4', away: 'c1', kickoff: 'Sat 13 Sep · 15:00' },
    { id: 'f5', round: 'Round 3', home: 'c1', away: 'c3', kickoff: 'Sat 20 Sep · 15:00' },
    { id: 'f6', round: 'Round 3', home: 'c2', away: 'c4', kickoff: 'Sat 20 Sep · 15:00' },
  ],
  s1b: [
    { id: 'f7', round: 'Round 1', home: 'c5', away: 'c6', kickoff: 'Sun 07 Sep · 14:00' },
    { id: 'f8', round: 'Round 1', home: 'c7', away: 'c8', kickoff: 'Sun 07 Sep · 14:00' },
    { id: 'f9', round: 'Round 2', home: 'c6', away: 'c7', kickoff: 'Sun 14 Sep · 14:00' },
    { id: 'f10', round: 'Round 2', home: 'c8', away: 'c5', kickoff: 'Sun 14 Sep · 14:00' },
  ],
}

// Pre-committed results so the standings table is not empty on first load.
const SEED = {
  s1a: {
    f1: { home: 2, away: 1, scorers: ['A. Reed', 'A. Reed', 'M. Cole'], locked: true },
    f2: { home: 0, away: 0, scorers: [], locked: true },
  },
  s1b: {
    f7: { home: 3, away: 2, scorers: ['J. Pike', 'J. Pike', 'J. Pike', 'D. Amos', 'D. Amos'], locked: true },
  },
}

const RULES = [
  { k: 'Win', v: '3 pts' },
  { k: 'Draw', v: '1 pt' },
  { k: 'Loss', v: '0 pts' },
  { k: 'Tiebreak 1', v: 'Goal difference' },
  { k: 'Tiebreak 2', v: 'Goals for' },
  { k: 'Tiebreak 3', v: 'Head-to-head' },
]

const emptyDraft = () => ({ home: '', away: '', scorers: [], scorerInput: '' })

export function AdminLeaguesPage() {
  const [seasonId, setSeasonId] = useState('s1a')
  const [results, setResults] = useState(SEED)
  const [drafts, setDrafts] = useState({})
  const [toast, setToast] = useState('')
  const [flashId, setFlashId] = useState(null)

  const clubs = CLUBS[seasonId]
  const fixtures = FIXTURES[seasonId]
  const committed = results[seasonId] || {}
  const nameOf = (id) => clubs.find((c) => c.id === id)?.name || '—'

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  const draftFor = (fid) => drafts[fid] || emptyDraft()
  const setDraft = (fid, patch) =>
    setDrafts((prev) => ({ ...prev, [fid]: { ...draftFor(fid), ...patch } }))

  function addScorer(fid) {
    const d = draftFor(fid)
    const name = d.scorerInput.trim()
    if (!name) return
    setDraft(fid, { scorers: [...d.scorers, name], scorerInput: '' })
  }
  function removeScorer(fid, idx) {
    const d = draftFor(fid)
    setDraft(fid, { scorers: d.scorers.filter((_, i) => i !== idx) })
  }

  function commit(fid) {
    const d = draftFor(fid)
    const h = parseInt(d.home, 10)
    const a = parseInt(d.away, 10)
    if (Number.isNaN(h) || Number.isNaN(a)) return fire('Enter both scores before committing')
    if (h < 0 || a < 0) return fire('Scores cannot be negative')
    setResults((prev) => ({
      ...prev,
      [seasonId]: { ...(prev[seasonId] || {}), [fid]: { home: h, away: a, scorers: d.scorers, locked: true } },
    }))
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[fid]
      return next
    })
    setFlashId(fid)
    setTimeout(() => setFlashId(null), 900)
    fire('Result committed · standings recalculated')
  }

  function amend(fid) {
    const r = committed[fid]
    setResults((prev) => {
      const nextSeason = { ...(prev[seasonId] || {}) }
      delete nextSeason[fid]
      return { ...prev, [seasonId]: nextSeason }
    })
    setDraft(fid, { home: String(r.home), away: String(r.away), scorers: r.scorers, scorerInput: '' })
    fire('Result unlocked for amendment')
  }

  function clearDraft(fid) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[fid]
      return next
    })
  }

  const committedList = fixtures.filter((f) => committed[f.id])
  const outstanding = fixtures.length - committedList.length
  const goalsRecorded = committedList.reduce((sum, f) => sum + committed[f.id].home + committed[f.id].away, 0)

  const standings = useMemo(() => {
    const table = {}
    clubs.forEach((c) => {
      table[c.id] = { id: c.id, name: c.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }
    })
    fixtures.forEach((f) => {
      const r = committed[f.id]
      if (!r) return
      const H = table[f.home]
      const A = table[f.away]
      if (!H || !A) return
      H.p++
      A.p++
      H.gf += r.home
      H.ga += r.away
      A.gf += r.away
      A.ga += r.home
      if (r.home > r.away) {
        H.w++
        A.l++
        H.pts += 3
        H.form.push('W')
        A.form.push('L')
      } else if (r.home < r.away) {
        A.w++
        H.l++
        A.pts += 3
        A.form.push('W')
        H.form.push('L')
      } else {
        H.d++
        A.d++
        H.pts += 1
        A.pts += 1
        H.form.push('D')
        A.form.push('D')
      }
    })
    return Object.values(table).sort(
      (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || x.name.localeCompare(y.name),
    )
  }, [clubs, fixtures, committed])

  const lastCommit = committedList[committedList.length - 1]

  return (
    <AdminShell footerNote="OVRX Admin Console · Competition Engine" footerRight="Standings are derived from committed results — never stored">
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Result Entry · Standings Derived Live</span>
            <h1 className="adm-title">Competition Engine</h1>
            <p className="adm-lead">
              Commit a scoreline and the table on the right rebuilds from every committed result — points,
              goal difference and form are computed, not stored. Locked results can be reopened for amendment.
            </p>
          </div>
          <label className="adm-field alg-seasonpick">
            <span className="adm-field__label">Active Season</span>
            <select
              className="adm-select"
              value={seasonId}
              onChange={(e) => {
                setSeasonId(e.target.value)
                setDrafts({})
              }}
            >
              {SEASONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="adm-counters alg-counters">
          <div className="adm-counter adm-counter--indigo">
            <span className="adm-counter__k">Clubs</span>
            <span className="adm-counter__v">{clubs.length}</span>
          </div>
          <div className="adm-counter adm-counter--green">
            <span className="adm-counter__k">Results Committed</span>
            <span className="adm-counter__v">{committedList.length}</span>
          </div>
          <div className="adm-counter adm-counter--amber">
            <span className="adm-counter__k">Results Outstanding</span>
            <span className="adm-counter__v">{outstanding}</span>
          </div>
          <div className="adm-counter adm-counter--pink">
            <span className="adm-counter__k">Goals Recorded</span>
            <span className="adm-counter__v">{goalsRecorded}</span>
          </div>
        </div>
      </section>

      <section className="adm-section alg-body">
        <div className="alg-fixtures">
          <h2 className="alg-colhead">Fixtures · {SEASONS.find((s) => s.id === seasonId).label}</h2>

          {fixtures.map((f) => {
            const r = committed[f.id]
            const d = draftFor(f.id)
            const isDraft = Boolean(drafts[f.id])
            return (
              <article key={f.id} className={`alg-fx ${r ? 'is-locked' : ''} ${flashId === f.id ? 'is-flash' : ''}`}>
                <div className="alg-fx__head">
                  <span className="alg-fx__round">{f.round}</span>
                  <span className="alg-fx__kick">{f.kickoff}</span>
                  {r && <span className="adm-pill adm-pill--green">Committed</span>}
                </div>

                <div className="alg-fx__scoreline">
                  <span className="alg-fx__team alg-fx__team--home">{nameOf(f.home)}</span>
                  {r ? (
                    <span className="alg-fx__final">
                      {r.home}<span className="alg-fx__dash">–</span>{r.away}
                    </span>
                  ) : (
                    <span className="alg-fx__inputs">
                      <input
                        className="adm-input alg-scorein"
                        type="number"
                        min="0"
                        max="30"
                        value={d.home}
                        onChange={(e) => setDraft(f.id, { home: e.target.value })}
                        aria-label={`${nameOf(f.home)} score`}
                      />
                      <span className="alg-fx__dash">:</span>
                      <input
                        className="adm-input alg-scorein"
                        type="number"
                        min="0"
                        max="30"
                        value={d.away}
                        onChange={(e) => setDraft(f.id, { away: e.target.value })}
                        aria-label={`${nameOf(f.away)} score`}
                      />
                    </span>
                  )}
                  <span className="alg-fx__team alg-fx__team--away">{nameOf(f.away)}</span>
                </div>

                {!r && (
                  <div className="alg-fx__scorers">
                    <span className="alg-fx__scorerslabel">Goalscorers</span>
                    <div className="alg-tagrow">
                      {d.scorers.map((s, i) => (
                        <button key={i} type="button" className="alg-tag" onClick={() => removeScorer(f.id, i)}>
                          {s}
                          <span className="alg-tag__x">×</span>
                        </button>
                      ))}
                      <input
                        className="alg-taginput"
                        type="text"
                        value={d.scorerInput}
                        placeholder="Add name + Enter"
                        onChange={(e) => setDraft(f.id, { scorerInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addScorer(f.id)
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="alg-fx__actions">
                  {r ? (
                    <>
                      <span className="alg-fx__lockednote">Result locked · affects standings</span>
                      <button type="button" className="adm-btn adm-btn--ghost" onClick={() => amend(f.id)}>
                        Amend
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="adm-btn adm-btn--green" onClick={() => commit(f.id)}>
                        Commit Result
                      </button>
                      {isDraft && (
                        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => clearDraft(f.id)}>
                          Clear
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <aside className="alg-side">
          <div className="alg-standings">
            <h2 className="alg-colhead">Live Standings Preview</h2>
            <div className="alg-tablewrap">
              <div className="alg-strow alg-strow--head">
                <span>#</span>
                <span>Club</span>
                <span>P</span>
                <span>W</span>
                <span>D</span>
                <span>L</span>
                <span>GD</span>
                <span>Pts</span>
                <span className="alg-strow__form">Form</span>
              </div>
              {standings.map((row, i) => (
                <div key={row.id} className="alg-strow">
                  <span className="alg-strow__pos">{i + 1}</span>
                  <span className="alg-strow__club">{row.name}</span>
                  <span>{row.p}</span>
                  <span>{row.w}</span>
                  <span>{row.d}</span>
                  <span>{row.l}</span>
                  <span>{row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}</span>
                  <span className="alg-strow__pts">{row.pts}</span>
                  <span className="alg-strow__form">
                    {row.form.slice(-5).map((r, fi) => (
                      <span key={fi} className={`alg-formdot alg-formdot--${r}`}>
                        {r}
                      </span>
                    ))}
                    {row.form.length === 0 && <span className="alg-formdot alg-formdot--none">–</span>}
                  </span>
                </div>
              ))}
            </div>
            <p className="alg-standings__note">
              Recomputed from {committedList.length} committed result{committedList.length === 1 ? '' : 's'} ·
              tiebreak GD → GF → head-to-head
            </p>
          </div>

          <div className="alg-lastcommit">
            <span className="alg-lastcommit__eyebrow">Last Commit</span>
            {lastCommit ? (
              <>
                <span className="alg-lastcommit__score">
                  {nameOf(lastCommit.home)} {committed[lastCommit.id].home}–{committed[lastCommit.id].away}{' '}
                  {nameOf(lastCommit.away)}
                </span>
                <span className="alg-lastcommit__meta">
                  {lastCommit.round} ·{' '}
                  {committed[lastCommit.id].scorers.length
                    ? committed[lastCommit.id].scorers.join(', ')
                    : 'No goalscorers recorded'}
                </span>
              </>
            ) : (
              <span className="alg-lastcommit__meta">No results committed this season yet.</span>
            )}
          </div>

          <div className="alg-rules">
            <span className="alg-rules__eyebrow">Rule Configuration · Read Only</span>
            <div className="alg-rules__grid">
              {RULES.map((r) => (
                <span key={r.k} className="alg-rules__row">
                  <span className="alg-rules__k">{r.k}</span>
                  <span className="alg-rules__v">{r.v}</span>
                </span>
              ))}
            </div>
            <span className="alg-rules__foot">Locked at season creation · contact platform owner to change</span>
          </div>
        </aside>
      </section>

      {toast && (
        <div className="adm-toast adm-toast--green">
          <span className="adm-toast__dot" />
          <span className="adm-toast__msg">{toast}</span>
        </div>
      )}
    </AdminShell>
  )
}
