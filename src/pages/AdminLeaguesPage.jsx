import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import { listClubs, getRoster } from '../api/clubs'
import {
  listCompetitions,
  getStandings,
  getFixtures,
  getBracket,
  getTopScorers,
} from '../api/competitions'
import {
  recordMatch,
  updateMatch,
  deleteMatch,
  updateCompetition,
  generateLeagueFixtures,
  generateKnockoutBracket,
  advanceKnockout,
} from '../api/admin'
import '../styles/admin-leagues.css'

// Admin Competition Engine. The platform runs a fixed pair of competitions —
// a 16-matchday league and a four-club cup (semi-finals, then the final) — so
// this page shapes them rather than creating them. Every result names its
// goalscorers, picked from the two clubs' squads.

const LEAGUE_MATCHDAYS = 16
const LEAGUE_ROUNDS = Array.from({ length: LEAGUE_MATCHDAYS }, (_, i) => `Matchday ${i + 1}`)
const CUP_ROUNDS = ['Semi-Finals', 'Final']
const CUP_CLUBS = 4
const MAX_SCORE = 20

const TODAY = new Date()
const todayISO = TODAY.toISOString().slice(0, 10)
const prettyToday = TODAY.toLocaleDateString(undefined, {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
})
const clockOf = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
const dayLabel = (iso) => {
  const day = (iso || '').slice(0, 10)
  if (day === todayISO) return 'Today'
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function scorersFor(goals, clubId) {
  return (goals || [])
    .filter((g) => g.clubId === clubId)
    .map((g) => ({ playerId: g.playerId, name: g.scorerName, minute: g.minute }))
}

function toMatch(f) {
  return {
    id: f.id,
    round: f.round,
    leg: f.leg,
    homeId: f.homeClubId,
    awayId: f.awayClubId,
    homeName: f.home,
    awayName: f.away,
    homeScore: f.homeScore ?? 0,
    awayScore: f.awayScore ?? 0,
    homeScorers: scorersFor(f.goals, f.homeClubId),
    awayScorers: scorersFor(f.goals, f.awayClubId),
    playedOn: (f.scheduledAt || '').slice(0, 10),
    scheduledAt: f.scheduledAt,
    status: f.status,
  }
}

// One entry per goal: which squad player scored it, and optionally when.
const blankGoal = () => ({ playerId: '', minute: '' })

function makeForm(type) {
  return {
    homeId: '',
    awayId: '',
    round: type === 'knockout' ? 'Semi-Finals' : 'Matchday 1',
    leg: type === 'knockout' ? 1 : null,
    homeScore: 0,
    awayScore: 0,
    homeGoals: [],
    awayGoals: [],
  }
}

// Grows or trims a goal list so it always has exactly `score` entries.
function resize(list, score) {
  const next = list.slice(0, score)
  while (next.length < score) next.push(blankGoal())
  return next
}

export function AdminLeaguesPage() {
  const [competitions, setCompetitions] = useState([])
  const [competitionId, setCompetitionId] = useState(null)
  const [clubs, setClubs] = useState([])
  const [matches, setMatches] = useState([])
  const [standings, setStandings] = useState([])
  const [scorers, setScorers] = useState([])
  const [bracket, setBracket] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState('')
  const [flashId, setFlashId] = useState(null)
  const formRef = useRef(null)

  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState({ name: '', season: '' })
  const [cupPicks, setCupPicks] = useState([])

  const comp = competitions.find((c) => c.id === competitionId) || null
  const isKnockout = comp?.type === 'knockout'

  const nameOf = useMemo(() => {
    const byId = new Map(clubs.map((c) => [c.id, c.name]))
    return (id) => byId.get(id) || '—'
  }, [clubs])

  const [form, setForm] = useState(() => makeForm('league'))
  // Squads for the two clubs currently in the form — goalscorers can only be
  // named from these.
  const [squads, setSquads] = useState({ home: [], away: [] })

  useEffect(() => {
    let cancelled = false
    Promise.all([listCompetitions(), listClubs()])
      .then(([comps, clubRows]) => {
        if (cancelled) return
        setCompetitions(comps)
        setClubs(clubRows.filter((c) => !c.archived))
        setCompetitionId((cur) => cur ?? comps[0]?.id ?? null)
        setLoadError('')
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.response?.data?.message || 'Could not load competitions.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reloadCompetition = useCallback(
    (id = competitionId, comps = competitions) => {
      if (!id) return Promise.resolve()
      const current = comps.find((c) => c.id === id)
      const jobs = [
        getFixtures(id)
          .then((rows) => setMatches(rows.map(toMatch)))
          .catch(() => setMatches([])),
        getTopScorers(id).then(setScorers).catch(() => setScorers([])),
      ]
      if (current?.type === 'knockout') {
        jobs.push(getBracket(id).then(setBracket).catch(() => setBracket([])))
        setStandings([])
      } else {
        jobs.push(getStandings(id).then(setStandings).catch(() => setStandings([])))
        setBracket([])
      }
      return Promise.all(jobs)
    },
    [competitionId, competitions],
  )

  useEffect(() => {
    reloadCompetition(competitionId, competitions)
  }, [competitionId, competitions, reloadCompetition])

  // Whenever the two clubs on the form change, pull their squads so the
  // goalscorer pickers only offer players who actually play for them.
  useEffect(() => {
    let cancelled = false
    const load = async (id) => {
      if (!id) return []
      try {
        const r = await getRoster(Number(id))
        return r.players
      } catch {
        return []
      }
    }
    Promise.all([load(form.homeId), load(form.awayId)]).then(([home, away]) => {
      if (!cancelled) setSquads({ home, away })
    })
    return () => {
      cancelled = true
    }
  }, [form.homeId, form.awayId])

  const playedMatches = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'played')
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)),
    [matches],
  )
  const scheduledFixtures = useMemo(
    () =>
      matches
        .filter((m) => m.status !== 'played')
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    [matches],
  )

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 3200)
  }

  function switchCompetition(id) {
    setCompetitionId(id)
    setEditingId(null)
    setRenaming(false)
    const next = competitions.find((c) => c.id === id)
    setForm(makeForm(next?.type || 'league'))
  }

  const patch = (p) => setForm((f) => ({ ...f, ...p }))

  function bump(side, delta) {
    setForm((f) => {
      const scoreKey = side === 'home' ? 'homeScore' : 'awayScore'
      const goalsKey = side === 'home' ? 'homeGoals' : 'awayGoals'
      const score = Math.max(0, Math.min(MAX_SCORE, f[scoreKey] + delta))
      return { ...f, [scoreKey]: score, [goalsKey]: resize(f[goalsKey], score) }
    })
  }

  function setGoal(side, index, field, value) {
    setForm((f) => {
      const key = side === 'home' ? 'homeGoals' : 'awayGoals'
      const next = f[key].map((g, i) => (i === index ? { ...g, [field]: value } : g))
      return { ...f, [key]: next }
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(makeForm(comp?.type || 'league'))
  }

  // Every goal must name a scorer before a result can be committed.
  const missingScorers =
    form.homeGoals.some((g) => !g.playerId) || form.awayGoals.some((g) => !g.playerId)

  function goalsPayload() {
    return [
      ...form.homeGoals.map((g) => ({
        clubId: Number(form.homeId),
        playerId: Number(g.playerId),
        minute: g.minute === '' ? null : Number(g.minute),
      })),
      ...form.awayGoals.map((g) => ({
        clubId: Number(form.awayId),
        playerId: Number(g.playerId),
        minute: g.minute === '' ? null : Number(g.minute),
      })),
    ]
  }

  async function submit() {
    if (busy) return
    if (!form.homeId || !form.awayId) return fire('Pick both clubs')
    if (form.homeId === form.awayId) return fire('A club cannot play itself')
    if (missingScorers) return fire('Name the scorer for every goal before committing the result')

    setBusy(true)
    try {
      const payload = {
        roundLabel: form.round,
        leg: isKnockout ? form.leg : null,
        homeScore: form.homeScore,
        awayScore: form.awayScore,
        goals: goalsPayload(),
      }
      const saved = editingId
        ? await updateMatch(editingId, payload)
        : await recordMatch(competitionId, {
            ...payload,
            homeClubId: Number(form.homeId),
            awayClubId: Number(form.awayId),
            playedOn: todayISO,
          })
      setFlashId(saved.id)
      fire(editingId ? 'Result updated · table recalculated' : 'Result recorded · table recalculated')
      await reloadCompetition(competitionId, competitions)
      setTimeout(() => setFlashId(null), 900)
      resetForm()
    } catch (err) {
      fire(err.response?.data?.message || 'Could not save the result')
    } finally {
      setBusy(false)
    }
  }

  function editMatch(m) {
    setEditingId(m.id)
    setForm({
      homeId: String(m.homeId),
      awayId: String(m.awayId),
      round: m.round || (isKnockout ? 'Semi-Finals' : 'Matchday 1'),
      leg: m.leg ?? (isKnockout ? 1 : null),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeGoals: m.homeScorers.length
        ? m.homeScorers.map((g) => ({ playerId: String(g.playerId ?? ''), minute: g.minute ?? '' }))
        : resize([], m.homeScore),
      awayGoals: m.awayScorers.length
        ? m.awayScorers.map((g) => ({ playerId: String(g.playerId ?? ''), minute: g.minute ?? '' }))
        : resize([], m.awayScore),
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function removeMatch(id) {
    if (busy) return
    setBusy(true)
    try {
      await deleteMatch(id)
      if (editingId === id) resetForm()
      await reloadCompetition(competitionId, competitions)
      fire('Match deleted · table recalculated')
    } catch (err) {
      fire(err.response?.data?.message || 'Could not delete the match')
    } finally {
      setBusy(false)
    }
  }

  async function saveRename() {
    if (!comp || busy) return
    const name = draft.name.trim()
    const season = draft.season.trim()
    if (!name || !season) return fire('Name and season are both required')
    setBusy(true)
    try {
      await updateCompetition(comp.id, { name, season })
      setCompetitions(await listCompetitions())
      setRenaming(false)
      fire('Competition updated')
    } catch (err) {
      fire(err.response?.data?.message || 'Could not save the competition')
    } finally {
      setBusy(false)
    }
  }

  async function genLeague() {
    if (!comp || busy) return
    setBusy(true)
    try {
      const res = await generateLeagueFixtures(comp.id, {
        clubIds: clubs.map((c) => c.id),
        doubleRound: true,
      })
      await reloadCompetition(comp.id, competitions)
      fire(`${res.created} fixtures across ${res.matchdays} of ${res.seasonMatchdays} matchdays`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not generate fixtures')
    } finally {
      setBusy(false)
    }
  }

  async function seedCup() {
    if (!comp || busy) return
    if (cupPicks.length !== CUP_CLUBS) return fire(`Pick exactly ${CUP_CLUBS} clubs for the cup`)
    setBusy(true)
    try {
      const res = await generateKnockoutBracket(comp.id, { clubIds: cupPicks })
      await reloadCompetition(comp.id, competitions)
      fire(`${res.round} seeded · ${res.ties} ties`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not seed the bracket')
    } finally {
      setBusy(false)
    }
  }

  async function advance() {
    if (!comp || busy) return
    setBusy(true)
    try {
      const res = await advanceKnockout(comp.id)
      await reloadCompetition(comp.id, competitions)
      fire(`${res.round} created · ${res.ties} tie${res.ties === 1 ? '' : 's'}`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not advance the round')
    } finally {
      setBusy(false)
    }
  }

  const goalsRecorded = playedMatches.reduce((n, m) => n + m.homeScore + m.awayScore, 0)
  const tiesDecided = bracket.reduce((n, r) => n + r.ties.filter((t) => t.through).length, 0)
  const leader = standings.find((r) => r.played > 0)
  const roundOptions = isKnockout ? CUP_ROUNDS : LEAGUE_ROUNDS
  const hasFixtures = matches.length > 0

  if (loading) {
    return (
      <AdminShell footerNote="OVRX Admin Console · Competition Engine">
        <section className="adm-section">
          <p className="adm-lead">Loading competitions…</p>
        </section>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      footerNote="OVRX Admin Console · Competition Engine"
      footerRight="Standings, brackets and scoring charts are derived from played matches"
    >
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Fixed League &amp; Cup · Tables Derived Live</span>
            <h1 className="adm-title">Competition Engine</h1>
            <p className="adm-lead">
              The platform runs two competitions: a {LEAGUE_MATCHDAYS}-matchday league and a{' '}
              {CUP_CLUBS}-club cup decided over semi-finals and a final. Record each result with its
              goalscorers — the table, the bracket and the scoring charts rebuild from them.
            </p>
            {loadError && <p className="adm-lead" style={{ color: '#FF2E63' }}>{loadError}</p>}
          </div>
        </div>

        <div className="alg-comptabs">
          {competitions.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`alg-comptab ${c.id === competitionId ? 'is-active' : ''}`}
              onClick={() => switchCompetition(c.id)}
            >
              <span className={`alg-comptab__type alg-comptab__type--${c.type}`}>
                {c.type === 'knockout' ? 'Cup' : 'League'}
              </span>
              <span className="alg-comptab__name">{c.name}</span>
              <span className="alg-comptab__season">Season {c.season}</span>
            </button>
          ))}
        </div>

        <div className="alg-comptools">
          {comp && !renaming && (
            <button
              type="button"
              className="adm-btn adm-btn--ghost"
              onClick={() => {
                setDraft({ name: comp.name, season: comp.season })
                setRenaming(true)
              }}
              disabled={busy}
            >
              Rename / Season
            </button>
          )}

          {comp && !isKnockout && !hasFixtures && (
            <button type="button" className="adm-btn adm-btn--green" onClick={genLeague} disabled={busy}>
              Generate Season Fixtures ({clubs.length} clubs)
            </button>
          )}
          {comp && isKnockout && !hasFixtures && (
            <button type="button" className="adm-btn adm-btn--green" onClick={seedCup} disabled={busy}>
              Seed Semi-Finals ({cupPicks.length}/{CUP_CLUBS} picked)
            </button>
          )}
          {comp && isKnockout && hasFixtures && (
            <button type="button" className="adm-btn adm-btn--green" onClick={advance} disabled={busy}>
              Advance to the Final
            </button>
          )}
        </div>

        {renaming && (
          <div className="alg-record alg-comppanel">
            <div className="alg-record__bar">
              <h2 className="alg-colhead">Edit · {comp?.name}</h2>
            </div>
            <div className="alg-record__grid">
              <label className="adm-field">
                <span className="adm-field__label">Name</span>
                <input
                  className="adm-select"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Season</span>
                <input
                  className="adm-select"
                  type="text"
                  value={draft.season}
                  onChange={(e) => setDraft((d) => ({ ...d, season: e.target.value }))}
                />
              </label>
            </div>
            <p className="alg-standings__note">
              The platform runs a fixed league and cup — competitions can&apos;t be added or removed,
              and a competition&apos;s type never changes.
            </p>
            <div className="alg-record__actions">
              <button type="button" className="adm-btn adm-btn--green" onClick={saveRename} disabled={busy}>
                Save Changes
              </button>
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setRenaming(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {comp && isKnockout && !hasFixtures && (
          <div className="alg-record alg-comppanel">
            <div className="alg-record__bar">
              <h2 className="alg-colhead">Pick the {CUP_CLUBS} cup clubs</h2>
              <span className="alg-today">{cupPicks.length} of {CUP_CLUBS} selected</span>
            </div>
            <div className="alg-cuppicks">
              {clubs.map((c) => {
                const on = cupPicks.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`alg-cuppick ${on ? 'is-on' : ''}`}
                    disabled={busy || (!on && cupPicks.length >= CUP_CLUBS)}
                    onClick={() =>
                      setCupPicks((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))
                    }
                  >
                    <span className="alg-cuppick__crest">{c.crestCode}</span>
                    <span className="alg-cuppick__name">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="adm-counters alg-counters">
          <div className="adm-counter adm-counter--indigo">
            <span className="adm-counter__k">Clubs</span>
            <span className="adm-counter__v">{clubs.length}</span>
          </div>
          <div className="adm-counter adm-counter--green">
            <span className="adm-counter__k">{isKnockout ? 'Ties Played' : 'Matches Played'}</span>
            <span className="adm-counter__v">
              {playedMatches.length}
              <span className="adm-counter__note">of {matches.length} scheduled</span>
            </span>
          </div>
          <div className="adm-counter adm-counter--pink">
            <span className="adm-counter__k">Goals Recorded</span>
            <span className="adm-counter__v">{goalsRecorded}</span>
          </div>
          <div className="adm-counter adm-counter--amber">
            <span className="adm-counter__k">{isKnockout ? 'Ties Decided' : 'Current Leader'}</span>
            <span className="adm-counter__v alg-counter--text">
              {isKnockout ? tiesDecided : leader ? leader.club : '—'}
            </span>
          </div>
        </div>
      </section>

      <section className="adm-section alg-body">
        <div className="alg-main">
          <div className="alg-record" ref={formRef}>
            <div className="alg-record__bar">
              <h2 className="alg-colhead">{editingId ? 'Edit Result' : 'Record a Result'}</h2>
              <span className="alg-today">
                <span className="alg-today__dot" />
                {editingId ? 'Editing an existing result' : `Played ${prettyToday}`}
              </span>
            </div>

            <div className="alg-record__grid">
              <label className="adm-field">
                <span className="adm-field__label">Home Club</span>
                <select
                  className="adm-select"
                  value={form.homeId}
                  onChange={(e) => patch({ homeId: e.target.value, homeGoals: resize([], form.homeScore) })}
                  disabled={Boolean(editingId)}
                >
                  <option value="">Select club…</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id} disabled={String(c.id) === form.awayId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Away Club</span>
                <select
                  className="adm-select"
                  value={form.awayId}
                  onChange={(e) => patch({ awayId: e.target.value, awayGoals: resize([], form.awayScore) })}
                  disabled={Boolean(editingId)}
                >
                  <option value="">Select club…</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id} disabled={String(c.id) === form.homeId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="adm-field">
                <span className="adm-field__label">{isKnockout ? 'Round' : 'Matchday'}</span>
                <select className="adm-select" value={form.round} onChange={(e) => patch({ round: e.target.value })}>
                  {roundOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>

              {isKnockout && (
                <div className="adm-field">
                  <span className="adm-field__label">Leg</span>
                  <span className="alg-seg">
                    {[1, 2].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`alg-seg__btn ${form.leg === v ? 'is-on' : ''}`}
                        onClick={() => patch({ leg: v })}
                      >
                        Leg {v}
                      </button>
                    ))}
                  </span>
                </div>
              )}
            </div>

            <div className="alg-scoreboard">
              {['home', 'away'].map((side) => (
                <div key={side} className="alg-scoreside">
                  <span className="alg-scoreside__name">
                    {form[`${side}Id`] ? nameOf(Number(form[`${side}Id`])) : side === 'home' ? 'Home' : 'Away'}
                  </span>
                  <span className="alg-step">
                    <button type="button" className="alg-step__btn" aria-label={`${side} score down`} onClick={() => bump(side, -1)}>
                      −
                    </button>
                    <span className="alg-step__v">{form[`${side}Score`]}</span>
                    <button type="button" className="alg-step__btn" aria-label={`${side} score up`} onClick={() => bump(side, 1)}>
                      +
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <div className="alg-scorers2">
              {['home', 'away'].map((side) => {
                const clubId = form[`${side}Id`]
                const goals = form[`${side}Goals`]
                const squad = squads[side]
                return (
                  <div key={side} className="alg-scorerbox">
                    <span className="alg-scorerbox__label">
                      {clubId ? nameOf(Number(clubId)) : side === 'home' ? 'Home' : 'Away'} goalscorers
                      <span className="alg-scorerbox__count">{goals.length} required</span>
                    </span>

                    {goals.length === 0 && <p className="alg-scorernote">No goals to record.</p>}

                    {goals.length > 0 && squad.length === 0 && (
                      <p className="alg-scorernote is-warn">
                        This club has no players on its roster yet — sign players before recording
                        goals for it.
                      </p>
                    )}

                    {goals.map((g, i) => (
                      <div key={i} className="alg-goalrow">
                        <span className="alg-goalrow__n">{i + 1}</span>
                        <select
                          className="adm-select"
                          value={g.playerId}
                          onChange={(e) => setGoal(side, i, 'playerId', e.target.value)}
                        >
                          <option value="">Select scorer…</option>
                          {squad.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.name} · {p.position}
                            </option>
                          ))}
                        </select>
                        <input
                          className="adm-select alg-goalrow__min"
                          type="number"
                          min="1"
                          max="130"
                          placeholder="min"
                          value={g.minute}
                          onChange={(e) => setGoal(side, i, 'minute', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            <p className="alg-standings__note">
              Every goal needs a scorer, picked from that club&apos;s squad. The minute is optional.
            </p>

            <div className="alg-record__actions">
              <button
                type="button"
                className="adm-btn adm-btn--green"
                onClick={submit}
                disabled={busy || missingScorers}
              >
                {editingId ? 'Save Result' : 'Record Result'}
              </button>
              <button type="button" className="adm-btn adm-btn--ghost" onClick={resetForm} disabled={busy}>
                {editingId ? 'Cancel Edit' : 'Reset'}
              </button>
            </div>
          </div>

          {scheduledFixtures.length > 0 && (
            <div className="alg-recorded">
              <h2 className="alg-colhead">
                Scheduled — Result Pending
                <span className="alg-recorded__n">{scheduledFixtures.length}</span>
              </h2>
              {scheduledFixtures.map((m) => (
                <article key={m.id} className="alg-rec">
                  <div className="alg-rec__top">
                    <span className="alg-rec__round">
                      {m.round}
                      {m.leg ? ` · Leg ${m.leg}` : ''}
                    </span>
                    <span className="alg-rec__when">{dayLabel(m.scheduledAt)}</span>
                  </div>
                  <div className="alg-rec__score">
                    <span className="alg-rec__team alg-rec__team--home">{m.homeName || nameOf(m.homeId)}</span>
                    <span className="alg-rec__nums">vs</span>
                    <span className="alg-rec__team alg-rec__team--away">{m.awayName || nameOf(m.awayId)}</span>
                  </div>
                  <div className="alg-rec__actions">
                    <button type="button" className="alg-minibtn" onClick={() => editMatch(m)} disabled={busy}>
                      Enter Result
                    </button>
                    <button
                      type="button"
                      className="alg-minibtn alg-minibtn--danger"
                      onClick={() => removeMatch(m.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="alg-recorded">
            <h2 className="alg-colhead">
              Played
              <span className="alg-recorded__n">{playedMatches.length}</span>
            </h2>

            {playedMatches.length === 0 && (
              <div className="adm-empty">
                <span className="adm-empty__title">No results yet</span>
                <span className="adm-empty__note">
                  {hasFixtures
                    ? 'Enter a result on one of the scheduled fixtures above.'
                    : 'Generate the season fixtures to get started.'}
                </span>
              </div>
            )}

            {playedMatches.map((m) => (
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
                    {dayLabel(m.scheduledAt)} · {clockOf(m.scheduledAt)}
                  </span>
                </div>

                <div className="alg-rec__score">
                  <span className="alg-rec__team alg-rec__team--home">{m.homeName || nameOf(m.homeId)}</span>
                  <span className="alg-rec__nums">
                    {m.homeScore}
                    <span className="alg-rec__dash">–</span>
                    {m.awayScore}
                  </span>
                  <span className="alg-rec__team alg-rec__team--away">{m.awayName || nameOf(m.awayId)}</span>
                </div>

                {(m.homeScorers.length > 0 || m.awayScorers.length > 0) && (
                  <div className="alg-rec__scorers">
                    <span className="alg-rec__side">
                      {m.homeScorers.length
                        ? m.homeScorers.map((g) => `${g.name}${g.minute ? ` ${g.minute}'` : ''}`).join(', ')
                        : '—'}
                    </span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A6784" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                    </svg>
                    <span className="alg-rec__side alg-rec__side--away">
                      {m.awayScorers.length
                        ? m.awayScorers.map((g) => `${g.name}${g.minute ? ` ${g.minute}'` : ''}`).join(', ')
                        : '—'}
                    </span>
                  </div>
                )}

                <div className="alg-rec__actions">
                  <button type="button" className="alg-minibtn" onClick={() => editMatch(m)} disabled={busy}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="alg-minibtn alg-minibtn--danger"
                    onClick={() => removeMatch(m.id)}
                    disabled={busy}
                  >
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
                  <span>#</span><span>Club</span><span>P</span><span>W</span><span>D</span>
                  <span>L</span><span>GD</span><span>Pts</span>
                  <span className="alg-strow__form">Form</span>
                </div>
                {standings.map((row, i) => (
                  <div key={row.clubId} className={`alg-strow ${row.played > 0 && i === 0 ? 'is-top' : ''}`}>
                    <span className="alg-strow__pos">{row.position}</span>
                    <span className="alg-strow__club">{row.club}</span>
                    <span>{row.played}</span>
                    <span>{row.won}</span>
                    <span>{row.drawn}</span>
                    <span>{row.lost}</span>
                    <span>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</span>
                    <span className="alg-strow__pts">{row.points}</span>
                    <span className="alg-strow__form">
                      {row.form.slice(-5).map((r, fi) => (
                        <span key={fi} className={`alg-formdot alg-formdot--${r}`}>{r}</span>
                      ))}
                      {row.form.length === 0 && <span className="alg-formdot alg-formdot--none">–</span>}
                    </span>
                  </div>
                ))}
              </div>
              <p className="alg-standings__note">
                Every club sits in the table from day one · {LEAGUE_MATCHDAYS}-matchday season ·
                tiebreak GD → GF → name
              </p>
            </div>
          )}

          {isKnockout && (
            <div className="alg-standings">
              <h2 className="alg-colhead">Bracket · Ties &amp; Aggregates</h2>
              {bracket.length === 0 && (
                <p className="alg-standings__note">Seed the semi-finals to open the bracket.</p>
              )}
              {bracket.map((r) => (
                <div key={r.round} className="alg-round">
                  <span className="alg-round__name">{r.round}</span>
                  {r.ties.map((t, ti) => (
                    <div key={ti} className={`alg-tie ${t.through ? 'is-decided' : ''}`}>
                      <div className="alg-tie__row">
                        <span className={`alg-tie__team ${t.through === t.home ? 'is-through' : ''}`}>{t.home}</span>
                        <span className="alg-tie__legs">
                          {t.agg ? (
                            <>
                              <span className="alg-tie__agg">{t.agg}</span>
                              <span className="alg-tie__legdetail">
                                L1 {t.leg1 || '—'}{t.leg2 ? ` · L2 ${t.leg2}` : ' · L2 —'}
                              </span>
                            </>
                          ) : (
                            <span className="alg-tie__agg">
                              {t.leg1 || '—'}{t.leg2 ? ` · ${t.leg2}` : ''}
                            </span>
                          )}
                        </span>
                        <span className={`alg-tie__team alg-tie__team--away ${t.through === t.away ? 'is-through' : ''}`}>
                          {t.away}
                        </span>
                      </div>
                      <span className="alg-tie__through">
                        {t.through
                          ? `${t.through} advance`
                          : t.pending
                            ? 'Tie still to be decided'
                            : 'Level — replay a leg to separate them'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="alg-standings">
            <h2 className="alg-colhead">Top Goalscorers</h2>
            {scorers.length === 0 ? (
              <p className="alg-standings__note">No goals recorded in this competition yet.</p>
            ) : (
              <div className="alg-scorertable">
                {scorers.map((s) => (
                  <div key={`${s.playerId}-${s.clubId}`} className="alg-scorerrow">
                    <span className="alg-scorerrow__rank">{s.rank}</span>
                    <span className="alg-scorerrow__name">{s.name}</span>
                    <span className="alg-scorerrow__club">{s.crestCode}</span>
                    <span className="alg-scorerrow__goals">{s.goals}</span>
                  </div>
                ))}
              </div>
            )}
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
