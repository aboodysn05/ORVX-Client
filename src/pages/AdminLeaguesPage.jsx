import { useEffect, useMemo, useRef, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import { listClubs } from '../api/clubs'
import { listCompetitions, getStandings, getFixtures, getBracket } from '../api/competitions'
import {
  recordMatch,
  updateMatch,
  deleteMatch,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  generateLeagueFixtures,
  generateKnockoutBracket,
  advanceKnockout,
} from '../api/admin'
import '../styles/admin-leagues.css'

// Admin Competition Engine — record a match on the day it's played and enter
// its result + goalscorers, for both competition types (league and knockout
// "tournament"). Live against the backend: matches are POST/PATCH/DELETEd to
// /admin/*, and the league table / knockout bracket are re-fetched from the
// backend (which derives them from played matches — never stored) after every
// change.

const KO_ROUNDS = ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final']
const LEAGUE_ROUNDS = Array.from({ length: 22 }, (_, i) => `Matchday ${i + 1}`)
const MAX_SCORE = 30

const RULES = [
  { k: 'Win', v: '3 pts' },
  { k: 'Draw', v: '1 pt' },
  { k: 'Loss', v: '0 pts' },
  { k: 'Tiebreak', v: 'GD → GF → name' },
]

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

// Flatten a fixture's goals[] into the two per-club name lists the form/record
// card work with.
function scorersFor(goals, clubId) {
  return (goals || []).filter((g) => g.clubId === clubId).map((g) => g.scorerName)
}

// Map a backend fixture (GET /competitions/:id/fixtures) to this page's shape.
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

// Build the goals[] payload the backend expects:
//  - `[]` for a goalless match (clears any stale scorers on an edit),
//  - the full list when both sides' named scorers exactly match their score,
//  - `undefined` (omit) when the lists are incomplete — goalscorers are
//    optional, and a partial list would be rejected as a GOAL_COUNT_MISMATCH.
function goalsPayload(form) {
  if (form.homeScore + form.awayScore === 0) return []
  const homeOk = form.homeScorers.length === form.homeScore
  const awayOk = form.awayScorers.length === form.awayScore
  if (!homeOk || !awayOk) return undefined
  return [
    ...form.homeScorers.map((scorerName) => ({ clubId: Number(form.homeId), scorerName })),
    ...form.awayScorers.map((scorerName) => ({ clubId: Number(form.awayId), scorerName })),
  ]
}

export function AdminLeaguesPage() {
  const [competitions, setCompetitions] = useState([])
  const [competitionId, setCompetitionId] = useState(null)
  const [clubs, setClubs] = useState([])
  const [matches, setMatches] = useState([])
  const [standings, setStandings] = useState([])
  const [bracket, setBracket] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState('')
  const [flashId, setFlashId] = useState(null)
  const formRef = useRef(null)

  // Competition management: null | 'new' | 'edit'
  const [compPanel, setCompPanel] = useState(null)
  const [compDraft, setCompDraft] = useState({ name: '', type: 'league', season: '' })

  const comp = competitions.find((c) => c.id === competitionId) || null
  const isKnockout = comp?.type === 'knockout'

  const nameOf = useMemo(() => {
    const byId = new Map(clubs.map((c) => [c.id, c.name]))
    return (id) => byId.get(id) || '—'
  }, [clubs])

  // --- initial load: competitions + clubs ---
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

  // --- per-competition data: fixtures + derived table/bracket ---
  function reloadCompetition(id = competitionId) {
    if (!id) return Promise.resolve()
    const current = competitions.find((c) => c.id === id)
    const jobs = [
      getFixtures(id)
        .then((rows) => setMatches(rows.map(toMatch)))
        .catch(() => setMatches([])),
    ]
    if (current?.type === 'knockout') {
      jobs.push(getBracket(id).then(setBracket).catch(() => setBracket([])))
      setStandings([])
    } else {
      jobs.push(getStandings(id).then(setStandings).catch(() => setStandings([])))
      setBracket([])
    }
    return Promise.all(jobs)
  }

  useEffect(() => {
    reloadCompetition(competitionId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId, competitions.length])

  // Played results, newest first — a match recorded today sits on top.
  const compMatches = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'played')
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)),
    [matches],
  )

  // Fixtures the admin still has to enter a result for.
  const scheduledFixtures = useMemo(
    () =>
      matches
        .filter((m) => m.status !== 'played')
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    [matches],
  )

  const nextRound = useMemo(() => {
    const nums = compMatches
      .map((m) => Number((m.round || '').match(/\d+/)?.[0]))
      .filter((n) => !Number.isNaN(n))
    return `Matchday ${nums.length ? Math.max(...nums) : 1}`
  }, [compMatches])

  const [form, setForm] = useState(() => makeForm('league', 'Matchday 1'))

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  function switchCompetition(id) {
    setCompetitionId(id)
    setEditingId(null)
    setCompPanel(null)
    const next = competitions.find((c) => c.id === id)
    setForm(makeForm(next?.type || 'league'))
  }

  // Re-fetch the competition list after a create/edit/delete. `selectId` (if
  // given and still present) becomes the active tab; otherwise the current tab
  // is kept, falling back to the first competition.
  function refreshCompetitions(selectId) {
    return listCompetitions().then((comps) => {
      setCompetitions(comps)
      setCompetitionId((cur) => {
        if (selectId != null && comps.some((c) => c.id === selectId)) return selectId
        if (comps.some((c) => c.id === cur)) return cur
        return comps[0]?.id ?? null
      })
      return comps
    })
  }

  function openNewCompetition() {
    setCompDraft({ name: '', type: 'league', season: '' })
    setCompPanel('new')
  }

  function openEditCompetition() {
    if (!comp) return
    setCompDraft({ name: comp.name, type: comp.type, season: comp.season })
    setCompPanel('edit')
  }

  async function saveCompetition() {
    if (busy) return
    const name = compDraft.name.trim()
    const season = compDraft.season.trim()
    if (!name || !season) return fire('Name and season are both required')
    setBusy(true)
    try {
      if (compPanel === 'new') {
        const created = await createCompetition({ name, type: compDraft.type, season })
        await refreshCompetitions(created.id)
        fire('Competition created')
      } else if (comp) {
        await updateCompetition(comp.id, { name, season })
        await refreshCompetitions(comp.id)
        fire('Competition updated')
      }
      setCompPanel(null)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not save the competition')
    } finally {
      setBusy(false)
    }
  }

  async function removeCompetition() {
    if (!comp || busy) return
    const n = matches.length
    const ok = window.confirm(
      `Delete "${comp.name}"? This permanently removes the competition and its ${n} match${n === 1 ? '' : 'es'}. This cannot be undone.`,
    )
    if (!ok) return
    setBusy(true)
    try {
      const res = await deleteCompetition(comp.id)
      await refreshCompetitions()
      setCompPanel(null)
      fire(`"${comp.name}" deleted · ${res.deletedMatches} match${res.deletedMatches === 1 ? '' : 'es'} removed`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not delete the competition')
    } finally {
      setBusy(false)
    }
  }

  const [doubleRound, setDoubleRound] = useState(false)

  async function genLeagueFixtures() {
    if (!comp || busy) return
    const clubIds = clubs.map((c) => c.id)
    if (clubIds.length < 2) return fire('Need at least two active clubs')
    setBusy(true)
    try {
      const res = await generateLeagueFixtures(comp.id, { clubIds, doubleRound })
      await reloadCompetition(comp.id)
      fire(`${res.created} fixtures generated across ${res.matchdays} matchdays`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not generate fixtures')
    } finally {
      setBusy(false)
    }
  }

  async function seedBracket() {
    if (!comp || busy) return
    const clubIds = clubs.map((c) => c.id)
    if (![2, 4, 8, 16].includes(clubIds.length)) {
      return fire('A bracket needs exactly 2, 4, 8 or 16 active clubs')
    }
    setBusy(true)
    try {
      const res = await generateKnockoutBracket(comp.id, { clubIds })
      await reloadCompetition(comp.id)
      fire(`${res.round} seeded · ${res.ties} ties`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not seed the bracket')
    } finally {
      setBusy(false)
    }
  }

  async function advanceBracket() {
    if (!comp || busy) return
    setBusy(true)
    try {
      const res = await advanceKnockout(comp.id)
      await reloadCompetition(comp.id)
      fire(`${res.round} created · ${res.ties} tie${res.ties === 1 ? '' : 's'}`)
    } catch (err) {
      fire(err.response?.data?.message || 'Could not advance the round')
    } finally {
      setBusy(false)
    }
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
    setForm(makeForm(comp?.type || 'league', nextRound))
  }

  async function submit() {
    if (busy) return
    if (!form.homeId || !form.awayId) return fire('Pick both clubs')
    if (form.homeId === form.awayId) return fire('A club cannot play itself')

    setBusy(true)
    try {
      if (editingId) {
        const saved = await updateMatch(editingId, {
          homeScore: form.homeScore,
          awayScore: form.awayScore,
          roundLabel: form.round,
          leg: isKnockout ? form.leg : null,
          goals: goalsPayload(form),
        })
        setFlashId(saved.id)
        fire('Match updated · table recalculated')
      } else {
        const saved = await recordMatch(competitionId, {
          homeClubId: Number(form.homeId),
          awayClubId: Number(form.awayId),
          roundLabel: form.round,
          leg: isKnockout ? form.leg : null,
          homeScore: form.homeScore,
          awayScore: form.awayScore,
          playedOn: todayISO,
          goals: goalsPayload(form),
        })
        setFlashId(saved.id)
        fire('Match recorded · table recalculated')
      }
      await reloadCompetition(competitionId)
      setTimeout(() => setFlashId(null), 900)
      resetForm()
    } catch (err) {
      fire(err.response?.data?.message || 'Could not save the match')
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
      homeScorers: [...m.homeScorers],
      awayScorers: [...m.awayScorers],
      homeInput: '',
      awayInput: '',
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function removeMatch(id) {
    if (busy) return
    setBusy(true)
    try {
      await deleteMatch(id)
      if (editingId === id) resetForm()
      await reloadCompetition(competitionId)
      fire('Match deleted · table recalculated')
    } catch (err) {
      fire(err.response?.data?.message || 'Could not delete the match')
    } finally {
      setBusy(false)
    }
  }

  // --- league standings: backend rows overlaid onto the full club list so
  // clubs yet to play still appear (bottom, all zeroes). ---
  const table = useMemo(() => {
    const played = new Map(standings.map((r) => [r.clubId, r]))
    const rows = clubs.map((c) => {
      const r = played.get(c.id)
      return r
        ? {
            id: c.id,
            name: c.name,
            p: r.played,
            w: r.won,
            d: r.drawn,
            l: r.lost,
            gd: r.goalDiff,
            gf: r.goalsFor,
            pts: r.points,
            form: r.form || [],
          }
        : { id: c.id, name: c.name, p: 0, w: 0, d: 0, l: 0, gd: 0, gf: 0, pts: 0, form: [] }
    })
    rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name))
    return rows
  }, [standings, clubs])

  const recordedToday = compMatches.filter((m) => m.playedOn === todayISO).length
  const goalsRecorded = compMatches.reduce((n, m) => n + m.homeScore + m.awayScore, 0)
  const tiesDecided = bracket.reduce((n, r) => n + r.ties.filter((t) => t.through).length, 0)
  const leader = table.find((r) => r.p > 0)

  const roundOptions = isKnockout ? KO_ROUNDS : LEAGUE_ROUNDS
  const scorerMismatch = (list, score) => list.length !== score

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
      footerRight="Standings & aggregates are derived from played matches — never stored"
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
                {c.type === 'knockout' ? 'Tournament' : 'League'}
              </span>
              <span className="alg-comptab__name">{c.name}</span>
              <span className="alg-comptab__season">Season {c.season}</span>
            </button>
          ))}
          <button
            type="button"
            className="alg-comptab alg-comptab--add"
            onClick={openNewCompetition}
            disabled={busy}
          >
            <span className="alg-comptab__type">Add</span>
            <span className="alg-comptab__name">+ New Competition</span>
            <span className="alg-comptab__season">League or tournament</span>
          </button>
        </div>

        <div className="alg-comptools">
          {comp && compPanel !== 'edit' && (
            <>
              <button type="button" className="adm-btn adm-btn--ghost" onClick={openEditCompetition} disabled={busy}>
                Rename / Season
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--ghost alg-comptools__danger"
                onClick={removeCompetition}
                disabled={busy}
              >
                Delete Competition
              </button>

              {!isKnockout && compMatches.length === 0 && scheduledFixtures.length === 0 && (
                <>
                  <button type="button" className="adm-btn adm-btn--green" onClick={genLeagueFixtures} disabled={busy}>
                    Generate Round-Robin
                  </button>
                  <label className="alg-comptools__check">
                    <input
                      type="checkbox"
                      checked={doubleRound}
                      onChange={(e) => setDoubleRound(e.target.checked)}
                    />
                    Home &amp; away (double round)
                  </label>
                </>
              )}
              {isKnockout && compMatches.length === 0 && scheduledFixtures.length === 0 && (
                <button type="button" className="adm-btn adm-btn--green" onClick={seedBracket} disabled={busy}>
                  Seed Bracket ({clubs.length} clubs)
                </button>
              )}
              {isKnockout && (compMatches.length > 0 || scheduledFixtures.length > 0) && (
                <button type="button" className="adm-btn adm-btn--green" onClick={advanceBracket} disabled={busy}>
                  Advance to Next Round
                </button>
              )}
            </>
          )}
        </div>

        {compPanel && (
          <div className="alg-record alg-comppanel">
            <div className="alg-record__bar">
              <h2 className="alg-colhead">
                {compPanel === 'new' ? 'New Competition' : `Edit · ${comp?.name}`}
              </h2>
            </div>
            <div className="alg-record__grid">
              <label className="adm-field">
                <span className="adm-field__label">Name</span>
                <input
                  className="adm-select"
                  type="text"
                  value={compDraft.name}
                  placeholder="e.g. Spring Development League"
                  onChange={(e) => setCompDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Season</span>
                <input
                  className="adm-select"
                  type="text"
                  value={compDraft.season}
                  placeholder="e.g. 2026/27"
                  onChange={(e) => setCompDraft((d) => ({ ...d, season: e.target.value }))}
                />
              </label>
              <label className="adm-field">
                <span className="adm-field__label">Type</span>
                <select
                  className="adm-select"
                  value={compDraft.type}
                  disabled={compPanel === 'edit'}
                  onChange={(e) => setCompDraft((d) => ({ ...d, type: e.target.value }))}
                >
                  <option value="league">League (round-robin table)</option>
                  <option value="knockout">Tournament (two-legged bracket)</option>
                </select>
              </label>
            </div>
            {compPanel === 'edit' && (
              <p className="alg-standings__note">
                A competition's type is fixed after creation — it would invalidate every recorded result.
              </p>
            )}
            <div className="alg-record__actions">
              <button type="button" className="adm-btn adm-btn--green" onClick={saveCompetition} disabled={busy}>
                {compPanel === 'new' ? 'Create Competition' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                onClick={() => setCompPanel(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="adm-counters alg-counters">
          <div className="adm-counter adm-counter--indigo">
            <span className="adm-counter__k">Clubs</span>
            <span className="adm-counter__v">{clubs.length}</span>
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
                <select
                  className="adm-select"
                  value={form.homeId}
                  onChange={(e) => patch({ homeId: e.target.value })}
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
                  onChange={(e) => patch({ awayId: e.target.value })}
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
                <span className="alg-scoreside__name">{form.homeId ? nameOf(Number(form.homeId)) : 'Home'}</span>
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
                <span className="alg-scoreside__name">{form.awayId ? nameOf(Number(form.awayId)) : 'Away'}</span>
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
                      {clubId ? nameOf(Number(clubId)) : side === 'home' ? 'Home' : 'Away'} goalscorers
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

            <p className="alg-standings__note">
              Goalscorer names are optional — leave them blank to just log the score. If you name any,
              each club's list must match its score exactly or the names are dropped.
            </p>

            <div className="alg-record__actions">
              <button type="button" className="adm-btn adm-btn--green" onClick={submit} disabled={busy}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {editingId ? 'Save Changes' : 'Record Match'}
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
                {table.map((row, i) => (
                  <div key={row.id} className={`alg-strow ${row.p > 0 && i === 0 ? 'is-top' : ''}`}>
                    <span className="alg-strow__pos">{i + 1}</span>
                    <span className="alg-strow__club">{row.name}</span>
                    <span>{row.p}</span>
                    <span>{row.w}</span>
                    <span>{row.d}</span>
                    <span>{row.l}</span>
                    <span>{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
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
                Rebuilt from {compMatches.length} played match{compMatches.length === 1 ? '' : 'es'} ·
                tiebreak GD → GF → name
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
                        <span className={`alg-tie__team ${t.through === t.home ? 'is-through' : ''}`}>
                          {t.home}
                        </span>
                        <span className="alg-tie__legs">
                          {t.agg ? (
                            <>
                              <span className="alg-tie__agg">{t.agg}</span>
                              <span className="alg-tie__legdetail">
                                L1 {t.leg1 || '—'}
                                {t.leg2 ? ` · L2 ${t.leg2}` : ' · L2 —'}
                              </span>
                            </>
                          ) : (
                            <span className="alg-tie__agg">
                              {t.leg1 || '—'}
                              {t.leg2 ? ` · ${t.leg2}` : ''}
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
