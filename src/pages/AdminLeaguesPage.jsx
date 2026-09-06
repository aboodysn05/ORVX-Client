import { useMemo, useRef, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-leagues.css'

// Admin Competition Engine — record a match on the day it's played and enter
// its result + goalscorers, for both competition types (league and knockout
// "tournament"). Frontend only: matches are held in local state, shaped like
// the backend `fixtures` table (round_label / leg / scores / status). Standings
// (league) and ties + aggregates (knockout) are DERIVED from recorded matches
// every render — never stored, the same rule the backend follows.

const COMPETITIONS = [
  { id: 'comp-league', name: 'Premier Development League', type: 'league', season: '2025/26' },
  { id: 'comp-cup', name: 'OVRX Cup', type: 'knockout', season: '2025/26' },
]

const CLUBS = [
  { id: 'ngf', name: 'Northgate FC' },
  { id: 'riv', name: 'Riverside United' },
  { id: 'esr', name: 'Eastside Rangers' },
  { id: 'har', name: 'Harbour Athletic' },
  { id: 'kin', name: 'Kingsway Town' },
  { id: 'mpf', name: 'Meadow Park FC' },
  { id: 'cwn', name: 'Central Wanderers' },
  { id: 'lkr', name: 'Lakeside Rovers' },
]

const KO_ROUNDS = ['Semi-Finals', 'Final']
const LEAGUE_ROUNDS = Array.from({ length: 16 }, (_, i) => `Matchday ${i + 1}`)
const MAX_SCORE = 30

const RULES = [
  { k: 'Win', v: '3 pts' },
  { k: 'Draw', v: '1 pt' },
  { k: 'Loss', v: '0 pts' },
  { k: 'Tiebreak', v: 'GD → GF → H2H' },
]

const TODAY = new Date()
const todayISO = TODAY.toISOString().slice(0, 10)
const prettyToday = TODAY.toLocaleDateString(undefined, {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
})
const clockOf = (ms) => new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
const dayLabel = (iso) => {
  if (iso === todayISO) return 'Today'
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

// --- seed matches so the standings / bracket are not empty on first load ---
let seq = 0
const mk = (competitionId, round, leg, homeId, awayId, hs, as, homeScorers, awayScorers, daysAgo) => ({
  id: `seed-${++seq}`,
  competitionId,
  round,
  leg,
  homeId,
  awayId,
  homeScore: hs,
  awayScore: as,
  homeScorers,
  awayScorers,
  playedOn: new Date(TODAY.getTime() - daysAgo * 86400000).toISOString().slice(0, 10),
  recordedAt: TODAY.getTime() - daysAgo * 86400000,
})

const SEED = [
  // League — two matchdays, every club has played
  mk('comp-league', 'Matchday 1', null, 'ngf', 'lkr', 4, 1, ['A. Reed', 'A. Reed', 'M. Cole', 'T. Frost'], ['P. Nunez'], 21),
  mk('comp-league', 'Matchday 1', null, 'riv', 'cwn', 2, 0, ['D. Amos', 'J. Pike'], [], 21),
  mk('comp-league', 'Matchday 1', null, 'esr', 'mpf', 3, 1, ['K. Boyd', 'K. Boyd', 'L. Hart'], ['S. Vane'], 21),
  mk('comp-league', 'Matchday 1', null, 'har', 'kin', 1, 1, ['R. Doyle'], ['C. Webb'], 21),
  mk('comp-league', 'Matchday 2', null, 'ngf', 'cwn', 3, 0, ['A. Reed', 'M. Cole', 'M. Cole'], [], 14),
  mk('comp-league', 'Matchday 2', null, 'lkr', 'mpf', 0, 2, [], ['S. Vane', 'O. Kerr'], 14),
  mk('comp-league', 'Matchday 2', null, 'riv', 'kin', 2, 1, ['D. Amos', 'D. Amos'], ['C. Webb'], 14),
  mk('comp-league', 'Matchday 2', null, 'esr', 'har', 1, 1, ['L. Hart'], ['R. Doyle'], 14),
  // Knockout — one semi-final tie decided over two legs, the other with
  // only leg 1 played (leg 2 still to come).
  mk('comp-cup', 'Semi-Finals', 1, 'ngf', 'mpf', 2, 0, ['A. Reed', 'M. Cole'], [], 13),
  mk('comp-cup', 'Semi-Finals', 2, 'mpf', 'ngf', 1, 3, ['S. Vane'], ['A. Reed', 'A. Reed', 'T. Frost'], 6),
  mk('comp-cup', 'Semi-Finals', 1, 'esr', 'riv', 1, 1, ['K. Boyd'], ['D. Amos'], 13),
]

const nameOf = (id) => CLUBS.find((c) => c.id === id)?.name || '—'

function makeForm(type, roundSeed) {
  return {
    homeId: '',
    awayId: '',
    round: type === 'knockout' ? 'Semi-Finals' : roundSeed || 'Matchday 1',
    leg: type === 'knockout' ? 1 : null,
    homeScore: 0,
    awayScore: 0,
    homeScorers: [],
    awayScorers: [],
    homeInput: '',
    awayInput: '',
  }
}

export function AdminLeaguesPage() {
  const [competitionId, setCompetitionId] = useState('comp-league')
  const [matches, setMatches] = useState(SEED)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState('')
  const [flashId, setFlashId] = useState(null)
  const formRef = useRef(null)

  const comp = COMPETITIONS.find((c) => c.id === competitionId)
  const isKnockout = comp.type === 'knockout'

  const compMatches = useMemo(
    () => matches.filter((m) => m.competitionId === competitionId).sort((a, b) => b.recordedAt - a.recordedAt),
    [matches, competitionId],
  )

  const nextMatchday = useMemo(() => {
    const nums = compMatches
      .map((m) => Number((m.round || '').match(/\d+/)?.[0]))
      .filter((n) => !Number.isNaN(n))
    return `Matchday ${nums.length ? Math.max(...nums) : 1}`
  }, [compMatches])

  const [form, setForm] = useState(() => makeForm(comp.type, nextMatchday))

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  function switchCompetition(id) {
    setCompetitionId(id)
    setEditingId(null)
    const next = COMPETITIONS.find((c) => c.id === id)
    setForm(makeForm(next.type))
  }

  const patch = (p) => setForm((f) => ({ ...f, ...p }))
  const bump = (side, delta) =>
    setForm((f) => {
      const key = side === 'home' ? 'homeScore' : 'awayScore'
      return { ...f, [key]: Math.max(0, Math.min(MAX_SCORE, f[key] + delta)) }
    })
  function addScorer(side) {
    setForm((f) => {
      const inputKey = side === 'home' ? 'homeInput' : 'awayInput'
      const listKey = side === 'home' ? 'homeScorers' : 'awayScorers'
      const name = f[inputKey].trim()
      if (!name) return f
      return { ...f, [listKey]: [...f[listKey], name], [inputKey]: '' }
    })
  }
  const removeScorer = (side, idx) =>
    setForm((f) => {
      const listKey = side === 'home' ? 'homeScorers' : 'awayScorers'
      return { ...f, [listKey]: f[listKey].filter((_, i) => i !== idx) }
    })

  function resetForm() {
    setEditingId(null)
    setForm(makeForm(comp.type, nextMatchday))
  }

  function submit() {
    if (!form.homeId || !form.awayId) return fire('Pick both clubs')
    if (form.homeId === form.awayId) return fire('A club cannot play itself')

    const record = {
      id: editingId || `m-${Date.now()}`,
      competitionId,
      round: form.round,
      leg: isKnockout ? form.leg : null,
      homeId: form.homeId,
      awayId: form.awayId,
      homeScore: form.homeScore,
      awayScore: form.awayScore,
      homeScorers: form.homeScorers,
      awayScorers: form.awayScorers,
      playedOn: editingId ? matches.find((m) => m.id === editingId).playedOn : todayISO,
      recordedAt: editingId ? matches.find((m) => m.id === editingId).recordedAt : Date.now(),
    }

    setMatches((prev) => {
      if (editingId) return prev.map((m) => (m.id === editingId ? record : m))
      return [record, ...prev]
    })
    setFlashId(record.id)
    setTimeout(() => setFlashId(null), 900)
    fire(editingId ? 'Match updated · table recalculated' : 'Match recorded · table recalculated')
    resetForm()
  }

  function editMatch(m) {
    setEditingId(m.id)
    setForm({
      homeId: m.homeId,
      awayId: m.awayId,
      round: m.round,
      leg: m.leg ?? (isKnockout ? 1 : null),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeScorers: [...m.homeScorers],
      awayScorers: [...m.awayScorers],
      homeInput: '',
      awayInput: '',
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function deleteMatch(id) {
    setMatches((prev) => prev.filter((m) => m.id !== id))
    if (editingId === id) resetForm()
    fire('Match deleted · table recalculated')
  }

  // --- derived: league standings ---
  const standings = useMemo(() => {
    const t = {}
    CLUBS.forEach((c) => {
      t[c.id] = { id: c.id, name: c.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }
    })
    const chrono = [...compMatches].sort((a, b) => a.recordedAt - b.recordedAt)
    chrono.forEach((m) => {
      const H = t[m.homeId]
      const A = t[m.awayId]
      if (!H || !A) return
      H.p++
      A.p++
      H.gf += m.homeScore
      H.ga += m.awayScore
      A.gf += m.awayScore
      A.ga += m.homeScore
      if (m.homeScore > m.awayScore) {
        H.w++, A.l++, (H.pts += 3), H.form.push('W'), A.form.push('L')
      } else if (m.homeScore < m.awayScore) {
        A.w++, H.l++, (A.pts += 3), A.form.push('W'), H.form.push('L')
      } else {
        H.d++, A.d++, H.pts++, A.pts++, H.form.push('D'), A.form.push('D')
      }
    })
    return Object.values(t).sort(
      (x, y) =>
        y.pts - x.pts ||
        y.gf - y.ga - (x.gf - x.ga) ||
        y.gf - x.gf ||
        x.name.localeCompare(y.name),
    )
  }, [compMatches])

  // --- derived: knockout ties (grouped by round, aggregated across legs) ---
  const bracket = useMemo(() => {
    const byRound = new Map()
    compMatches.forEach((m) => {
      if (!byRound.has(m.round)) byRound.set(m.round, new Map())
      const pk = [m.homeId, m.awayId].slice().sort().join('~')
      const map = byRound.get(m.round)
      if (!map.has(pk)) map.set(pk, [])
      map.get(pk).push(m)
    })
    return KO_ROUNDS.filter((rn) => byRound.has(rn)).map((rn) => {
      const ties = [...byRound.get(rn).values()].map((legs) => {
        const leg1 = legs.find((x) => x.leg === 1) || legs.find((x) => x.leg == null) || legs[0]
        const leg2 = legs.find((x) => x.leg === 2) || null
        const homeId = leg1.homeId
        const awayId = leg1.awayId
        const goalsFor = (id) =>
          legs.reduce((n, l) => n + (l.homeId === id ? l.homeScore : l.awayId === id ? l.awayScore : 0), 0)
        // A numbered leg (1 or 2) always implies a two-legged tie; leg === null
        // is a genuine one-off match decided on the night.
        const twoLeg = leg1.leg != null
        const aggH = goalsFor(homeId)
        const aggA = goalsFor(awayId)
        const decided = twoLeg ? Boolean(leg2) : true
        const through = !decided || aggH === aggA ? null : aggH > aggA ? homeId : awayId
        return { homeId, awayId, leg1, leg2, twoLeg, aggH, aggA, decided, through }
      })
      return { round: rn, ties }
    })
  }, [compMatches])

  const recordedToday = compMatches.filter((m) => m.playedOn === todayISO).length
  const goalsRecorded = compMatches.reduce((n, m) => n + m.homeScore + m.awayScore, 0)
  const tiesDecided = bracket.reduce((n, r) => n + r.ties.filter((t) => t.through).length, 0)
  const leader = standings.find((r) => r.p > 0)

  const roundOptions = isKnockout ? KO_ROUNDS : LEAGUE_ROUNDS
  const scorerMismatch = (list, score) => list.length !== score

  return (
    <AdminShell
      footerNote="OVRX Admin Console · Competition Engine"
      footerRight="Standings & aggregates are derived from recorded matches — never stored"
    >
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Same-Day Result Entry · Tables Derived Live</span>
            <h1 className="adm-title">Competition Engine</h1>
            <p className="adm-lead">
              Record a match on the day it's played — pick the two clubs, enter the score and the
              goalscorers, and commit. Works for both the round-robin league and the knockout cup;
              the league table and cup bracket rebuild from every match you record.
            </p>
          </div>
        </div>

        <div className="alg-comptabs">
          {COMPETITIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`alg-comptab ${c.id === competitionId ? 'is-active' : ''}`}
              onClick={() => switchCompetition(c.id)}
            >
              <span className={`alg-comptab__type alg-comptab__type--${c.type}`}>
                {c.type === 'knockout' ? 'Tournament' : 'League'}
              </span>
              <span className="alg-comptab__name">{c.name}</span>
              <span className="alg-comptab__season">Season {c.season}</span>
            </button>
          ))}
        </div>

        <div className="adm-counters alg-counters">
          <div className="adm-counter adm-counter--indigo">
            <span className="adm-counter__k">Clubs</span>
            <span className="adm-counter__v">{CLUBS.length}</span>
          </div>
          <div className="adm-counter adm-counter--green">
            <span className="adm-counter__k">Recorded Today</span>
            <span className="adm-counter__v">
              {recordedToday}
              <span className="adm-counter__note">of {compMatches.length} total</span>
            </span>
          </div>
          <div className="adm-counter adm-counter--pink">
            <span className="adm-counter__k">Goals Recorded</span>
            <span className="adm-counter__v">{goalsRecorded}</span>
          </div>
          <div className="adm-counter adm-counter--amber">
            <span className="adm-counter__k">{isKnockout ? 'Ties Decided' : 'Current Leader'}</span>
            <span className="adm-counter__v alg-counter--text">
              {isKnockout ? tiesDecided : leader ? leader.name : '—'}
            </span>
          </div>
        </div>
      </section>

      <section className="adm-section alg-body">
        <div className="alg-main">
          <div className="alg-record" ref={formRef}>
            <div className="alg-record__bar">
              <h2 className="alg-colhead">{editingId ? 'Edit Recorded Match' : 'Record a Match'}</h2>
              <span className="alg-today">
                <span className="alg-today__dot" />
                {editingId ? 'Editing an existing result' : `Played ${prettyToday}`}
              </span>
            </div>

            <div className="alg-record__grid">
              <label className="adm-field">
                <span className="adm-field__label">Home Club</span>
                <select className="adm-select" value={form.homeId} onChange={(e) => patch({ homeId: e.target.value })}>
                  <option value="">Select club…</option>
                  {CLUBS.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === form.awayId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Away Club</span>
                <select className="adm-select" value={form.awayId} onChange={(e) => patch({ awayId: e.target.value })}>
                  <option value="">Select club…</option>
                  {CLUBS.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === form.homeId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="adm-field">
                <span className="adm-field__label">{isKnockout ? 'Round' : 'Matchday'}</span>
                <select className="adm-select" value={form.round} onChange={(e) => patch({ round: e.target.value })}>
                  {roundOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              {isKnockout && (
                <div className="adm-field">
                  <span className="adm-field__label">Leg</span>
                  <span className="alg-seg">
                    {[
                      { v: 1, label: 'Leg 1' },
                      { v: 2, label: 'Leg 2' },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        className={`alg-seg__btn ${form.leg === o.v ? 'is-on' : ''}`}
                        onClick={() => patch({ leg: o.v })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </span>
                </div>
              )}
            </div>

            <div className="alg-scoreboard">
              <div className="alg-scoreside">
                <span className="alg-scoreside__name">{form.homeId ? nameOf(form.homeId) : 'Home'}</span>
                <span className="alg-step">
                  <button type="button" className="alg-step__btn" aria-label="Home score down" onClick={() => bump('home', -1)}>
                    −
                  </button>
                  <span className="alg-step__v">{form.homeScore}</span>
                  <button type="button" className="alg-step__btn" aria-label="Home score up" onClick={() => bump('home', 1)}>
                    +
                  </button>
                </span>
              </div>
              <span className="alg-scoreboard__vs">vs</span>
              <div className="alg-scoreside">
                <span className="alg-scoreside__name">{form.awayId ? nameOf(form.awayId) : 'Away'}</span>
                <span className="alg-step">
                  <button type="button" className="alg-step__btn" aria-label="Away score down" onClick={() => bump('away', -1)}>
                    −
                  </button>
                  <span className="alg-step__v">{form.awayScore}</span>
                  <button type="button" className="alg-step__btn" aria-label="Away score up" onClick={() => bump('away', 1)}>
                    +
                  </button>
                </span>
              </div>
            </div>

            <div className="alg-scorers2">
              {['home', 'away'].map((side) => {
                const listKey = side === 'home' ? 'homeScorers' : 'awayScorers'
                const inputKey = side === 'home' ? 'homeInput' : 'awayInput'
                const score = side === 'home' ? form.homeScore : form.awayScore
                const clubId = side === 'home' ? form.homeId : form.awayId
                return (
                  <div key={side} className="alg-scorerbox">
                    <span className="alg-scorerbox__label">
                      {clubId ? nameOf(clubId) : side === 'home' ? 'Home' : 'Away'} goalscorers
                      <span className={`alg-scorerbox__count ${scorerMismatch(form[listKey], score) ? 'is-off' : ''}`}>
                        {form[listKey].length}/{score}
                      </span>
                    </span>
                    <div className="alg-tagrow">
                      {form[listKey].map((s, i) => (
                        <button key={i} type="button" className="alg-tag" onClick={() => removeScorer(side, i)}>
                          {s}
                          <span className="alg-tag__x">×</span>
                        </button>
                      ))}
                      <input
                        className="alg-taginput"
                        type="text"
                        value={form[inputKey]}
                        placeholder="Name + Enter"
                        onChange={(e) => patch({ [inputKey]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addScorer(side)
                          }
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="alg-record__actions">
              <button type="button" className="adm-btn adm-btn--green" onClick={submit}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {editingId ? 'Save Changes' : 'Record Match'}
              </button>
              <button type="button" className="adm-btn adm-btn--ghost" onClick={resetForm}>
                {editingId ? 'Cancel Edit' : 'Reset'}
              </button>
            </div>
          </div>

          <div className="alg-recorded">
            <h2 className="alg-colhead">
              Recorded Matches
              <span className="alg-recorded__n">{compMatches.length}</span>
            </h2>

            {compMatches.length === 0 && (
              <div className="adm-empty">
                <span className="adm-empty__title">Nothing Recorded Yet</span>
                <span className="adm-empty__note">Record the first match of this competition above.</span>
              </div>
            )}

            {compMatches.map((m) => (
              <article
                key={m.id}
                className={`alg-rec ${flashId === m.id ? 'is-flash' : ''} ${m.playedOn === todayISO ? 'is-today' : ''}`}
              >
                <div className="alg-rec__top">
                  <span className="alg-rec__round">
                    {m.round}
                    {m.leg ? ` · Leg ${m.leg}` : ''}
                  </span>
                  <span className="alg-rec__when">
                    {dayLabel(m.playedOn)} · {clockOf(m.recordedAt)}
                  </span>
                </div>

                <div className="alg-rec__score">
                  <span className="alg-rec__team alg-rec__team--home">{nameOf(m.homeId)}</span>
                  <span className="alg-rec__nums">
                    {m.homeScore}
                    <span className="alg-rec__dash">–</span>
                    {m.awayScore}
                  </span>
                  <span className="alg-rec__team alg-rec__team--away">{nameOf(m.awayId)}</span>
                </div>

                {(m.homeScorers.length > 0 || m.awayScorers.length > 0) && (
                  <div className="alg-rec__scorers">
                    <span className="alg-rec__side">
                      {m.homeScorers.length ? m.homeScorers.join(', ') : '—'}
                    </span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A6784" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                    </svg>
                    <span className="alg-rec__side alg-rec__side--away">
                      {m.awayScorers.length ? m.awayScorers.join(', ') : '—'}
                    </span>
                  </div>
                )}

                <div className="alg-rec__actions">
                  <button type="button" className="alg-minibtn" onClick={() => editMatch(m)}>
                    Edit
                  </button>
                  <button type="button" className="alg-minibtn alg-minibtn--danger" onClick={() => deleteMatch(m.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="alg-side">
          {!isKnockout && (
            <div className="alg-standings">
              <h2 className="alg-colhead">Live League Table</h2>
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
                  <div key={row.id} className={`alg-strow ${row.p > 0 && i === 0 ? 'is-top' : ''}`}>
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
                Rebuilt from {compMatches.length} recorded match{compMatches.length === 1 ? '' : 'es'} ·
                tiebreak GD → GF → head-to-head
              </p>
            </div>
          )}

          {isKnockout && (
            <div className="alg-standings">
              <h2 className="alg-colhead">Bracket · Ties &amp; Aggregates</h2>
              {bracket.length === 0 && (
                <p className="alg-standings__note">No cup matches recorded yet.</p>
              )}
              {bracket.map((r) => (
                <div key={r.round} className="alg-round">
                  <span className="alg-round__name">{r.round}</span>
                  {r.ties.map((t, ti) => (
                    <div key={ti} className={`alg-tie ${t.through ? 'is-decided' : ''}`}>
                      <div className="alg-tie__row">
                        <span className={`alg-tie__team ${t.through === t.homeId ? 'is-through' : ''}`}>
                          {nameOf(t.homeId)}
                        </span>
                        <span className="alg-tie__legs">
                          {t.twoLeg ? (
                            <>
                              <span className="alg-tie__agg">
                                {t.aggH}<span className="alg-rec__dash">–</span>{t.aggA}
                              </span>
                              <span className="alg-tie__legdetail">
                                L1 {t.leg1.homeScore}-{t.leg1.awayScore}
                                {t.leg2 ? ` · L2 ${t.leg2.awayScore}-${t.leg2.homeScore}` : ' · L2 —'}
                              </span>
                            </>
                          ) : (
                            <span className="alg-tie__agg">
                              {t.leg1.homeScore}<span className="alg-rec__dash">–</span>{t.leg1.awayScore}
                            </span>
                          )}
                        </span>
                        <span className={`alg-tie__team alg-tie__team--away ${t.through === t.awayId ? 'is-through' : ''}`}>
                          {nameOf(t.awayId)}
                        </span>
                      </div>
                      <span className="alg-tie__through">
                        {t.through
                          ? `${nameOf(t.through)} advance`
                          : t.twoLeg && !t.leg2
                            ? 'Second leg to play'
                            : 'Level — extra time / penalties'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <p className="alg-standings__note">
                Every tie is two-legged — the winner is the higher aggregate score across both legs.
              </p>
            </div>
          )}

          {!isKnockout && (
            <div className="alg-rules">
              <span className="alg-rules__eyebrow">Points · Read Only</span>
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
          )}
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
