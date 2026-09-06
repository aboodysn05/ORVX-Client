import { useCallback, useEffect, useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import { attrsFor } from '../utils/attributes'
import { listAdminDrills, createDrill, updateDrill, setDrillRetired } from '../api/admin'
import '../styles/admin-drills.css'

// Admin Global Drill Catalogue Configuration — live from GET /admin/drills.
// A drill boosts one or more attributes (weight 1-3) and carries per-drill
// volume caps the Session Builder enforces (backend/src/services/drills.service.js).

const ATTR_GROUPS = {
  outfield: attrsFor('Attacker'), // [{ key, code, name } x6]
  goalkeeper: attrsFor('Goalkeeper'),
}
const ALL_ATTRS = [...ATTR_GROUPS.outfield, ...ATTR_GROUPS.goalkeeper]

// The backend keys boosts by lowercase attribute name; this page works in the
// short uppercase display codes.
const CODE_TO_KEY = Object.fromEntries(ALL_ATTRS.map((a) => [a.code, a.key]))
const KEY_TO_CODE = Object.fromEntries(ALL_ATTRS.map((a) => [a.key, a.code]))

function toFrontendDrill(d) {
  return {
    id: d.id,
    code: `DRL-${String(d.id).padStart(3, '0')}`,
    name: d.name,
    category: d.category || 'General',
    group: d.positionGroup === 'goalkeeper' ? 'goalkeeper' : 'outfield',
    boosts: Object.fromEntries(
      Object.entries(d.boosts || {}).map(([k, v]) => [KEY_TO_CODE[k] || k.toUpperCase(), v]),
    ),
    level: d.level || 'Intermediate',
    minReps: d.minReps,
    maxReps: d.maxReps,
    minSets: d.minSets,
    maxSets: d.maxSets,
    secondsPerSet: d.secondsPerSet,
    active: d.active,
    video: Boolean(d.demoVideoUrl),
  }
}

function boostsToPayload(boosts) {
  return Object.entries(boosts).map(([code, value]) => ({
    code: CODE_TO_KEY[code] || code.toLowerCase(),
    value,
  }))
}

// Admin-catalogue display colours per attribute code (there is no canonical
// colour map in the app yet — this is a presentation concern local to the
// console).
const ATTR_COLOR = {
  PAC: '#10B981', DRI: '#F59E0B', SHO: '#FF2E63', PAS: '#4F46E5', DEF: '#A5B0FF', PHY: '#E8ECF5',
  REF: '#10B981', HAN: '#4F46E5', DIV: '#FF2E63', POS: '#A5B0FF', KIC: '#F59E0B', SPD: '#38BDF8',
}
const attrMeta = (code) => {
  const m = ALL_ATTRS.find((a) => a.code === code)
  return { code, name: m ? m.name : code, color: ATTR_COLOR[code] || '#8B97AF' }
}

const CATEGORIES = [
  'Sprint & Agility', 'Finishing', 'Ball Control', 'Passing & Vision',
  'Defensive Shape', 'Strength & Conditioning', 'Goalkeeping',
]
const LEVELS = ['Beginner', 'Intermediate', 'Elite']
const BOOST_STEPS = [1, 2, 3]

const GROUP_FILTERS = ['All', 'Outfield', 'Goalkeeper']
const STATUS_FILTERS = ['All', 'Active', 'Retired']

const totalXp = (boosts) => Object.values(boosts).reduce((n, v) => n + v, 0)
const sortedBoosts = (boosts) => Object.entries(boosts).sort((a, b) => b[1] - a[1])
const primaryCode = (boosts) => sortedBoosts(boosts)[0]?.[0] || null

export function AdminDrillsPage() {
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [attrFilter, setAttrFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(null) // drill id | 'new' | null
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  const load = useCallback(() => {
    setLoading(true)
    listAdminDrills()
      .then((rows) => {
        setList(rows.map(toFrontendDrill))
        setLoadError('')
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load the drill catalogue.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  // Close the drawer on Escape.
  useEffect(() => {
    if (!form) return undefined
    const onKey = (e) => e.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  // Attribute chips follow the selected position group.
  const attrChoices =
    groupFilter === 'Outfield'
      ? ATTR_GROUPS.outfield
      : groupFilter === 'Goalkeeper'
        ? ATTR_GROUPS.goalkeeper
        : ALL_ATTRS

  const visible = list.filter((d) => {
    if (groupFilter !== 'All' && d.group !== groupFilter.toLowerCase()) return false
    if (attrFilter !== 'All' && !d.boosts[attrFilter]) return false
    if (statusFilter === 'Active' && !d.active) return false
    if (statusFilter === 'Retired' && d.active) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      if (!d.name.toLowerCase().includes(q) && !d.code.toLowerCase().includes(q)) return false
    }
    return true
  })

  const activeCount = list.filter((d) => d.active).length

  function selectGroupFilter(g) {
    setGroupFilter(g)
    if (g !== 'All') {
      const codes = new Set(ATTR_GROUPS[g.toLowerCase()].map((a) => a.code))
      if (attrFilter !== 'All' && !codes.has(attrFilter)) setAttrFilter('All')
    }
  }

  function closeDrawer() {
    setEditing(null)
    setForm(null)
  }
  function openEdit(d) {
    setEditing(d.id)
    setForm({ ...d, isNew: false })
  }
  function openCreate() {
    setEditing('new')
    setForm({
      name: '', category: CATEGORIES[0], group: 'outfield', boosts: { PAC: 2 },
      level: 'Intermediate', minReps: 4, maxReps: 20, minSets: 1, maxSets: 4,
      secondsPerSet: 120, active: true, video: false, isNew: true,
    })
  }

  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const num = (k, v, lo, hi) => {
    const n = parseInt(v, 10)
    patch(k, Number.isNaN(n) ? lo : Math.max(lo, Math.min(hi, n)))
  }
  function setGroup(group) {
    setForm((f) => {
      const allowed = new Set(ATTR_GROUPS[group].map((a) => a.code))
      const boosts = Object.fromEntries(Object.entries(f.boosts).filter(([c]) => allowed.has(c)))
      return { ...f, group, boosts }
    })
  }
  function toggleBoost(code) {
    setForm((f) => {
      const next = { ...f.boosts }
      if (next[code]) delete next[code]
      else next[code] = 2
      return { ...f, boosts: next }
    })
  }
  const setBoost = (code, val) => setForm((f) => ({ ...f, boosts: { ...f.boosts, [code]: val } }))

  const f = form || {}
  const repsBad = f.minReps > f.maxReps
  const setsBad = f.minSets > f.maxSets
  const noAttr = form && Object.keys(f.boosts || {}).length === 0
  const formAttrs = form ? ATTR_GROUPS[f.group] : []

  async function save() {
    if (repsBad || setsBad) return fire('Fix the min/max conflict before saving')
    if (!f.name.trim()) return fire('Drill name is required')
    if (noAttr) return fire('Select at least one target attribute')
    setBusy(true)
    try {
      if (editing === 'new') {
        const drill = await createDrill({
          name: f.name.trim(),
          category: f.category,
          level: f.level,
          unitKind: 'reps',
          positionGroup: f.group,
          minSets: f.minSets,
          maxSets: f.maxSets,
          minReps: f.minReps,
          maxReps: f.maxReps,
          defaultSets: f.minSets,
          defaultReps: f.minReps,
          secondsPerSet: f.secondsPerSet || 120,
          demoVideoUrl: f.video ? 'https://example.com/demo-clip.mp4' : null,
          active: f.active,
          boosts: boostsToPayload(f.boosts),
        })
        fire(`${drill.name} added to the catalogue`)
      } else {
        await updateDrill(editing, {
          name: f.name.trim(),
          category: f.category,
          level: f.level,
          positionGroup: f.group,
          minSets: f.minSets,
          maxSets: f.maxSets,
          minReps: f.minReps,
          maxReps: f.maxReps,
          demoVideoUrl: f.video ? 'https://example.com/demo-clip.mp4' : null,
          active: f.active,
          boosts: boostsToPayload(f.boosts),
        })
        fire(`${f.name} saved`)
      }
      closeDrawer()
      load()
    } catch (err) {
      fire(err.response?.data?.message || 'Could not save the drill.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleRetire() {
    setBusy(true)
    try {
      await setDrillRetired(editing, f.active) // f.active is the current state -> retire if active
      fire(`${f.name}${f.active ? ' retired — hidden from builder' : ' reinstated'}`)
      closeDrawer()
      load()
    } catch (err) {
      fire(err.response?.data?.message || 'Could not update the drill.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminShell
      footerNote="OVRX Admin Console · Drill Catalogue"
      footerRight="Caps apply to sessions built after saving"
    >
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Single Source · Read By Drills &amp; Session Builder</span>
            <h1 className="adm-title">Global Drill Catalogue Configuration</h1>
            <p className="adm-lead">
              XP weight per attribute and volume caps set here govern every session a player can
              build. A drill can push more than one attribute. Retiring a drill removes it from the
              builder without touching sessions already logged against it.
            </p>
          </div>
          <button type="button" className="adm-btn" onClick={openCreate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create New Drill
          </button>
        </div>

        <div className="acl-counters adr-counters">
          {[
            { k: 'Catalogue Size', v: list.length, note: 'total drills', tone: 'indigo' },
            { k: 'Active In Builder', v: activeCount, note: 'player-selectable', tone: 'green' },
            { k: 'Retired', v: list.length - activeCount, note: 'history retained', tone: 'pink' },
            { k: 'Goalkeeping', v: list.filter((d) => d.group === 'goalkeeper').length, note: 'GK-attribute drills', tone: 'amber' },
          ].map((c) => (
            <span key={c.k} className={`adm-counter adm-counter--${c.tone}`}>
              <span className="adm-counter__k">{c.k}</span>
              <span className="adm-counter__v">
                {c.v}
                <span className="adm-counter__note">{c.note}</span>
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className="adm-section adr-toolbar">
        <label className="adr-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search drill name or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="adr-filtergroup">
          {GROUP_FILTERS.map((g) => (
            <button
              key={g}
              type="button"
              className={`adm-chipbtn ${groupFilter === g ? 'is-active-indigo' : ''}`}
              onClick={() => selectGroupFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="adr-filtergroup">
          {STATUS_FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              className={`adm-chipbtn ${statusFilter === label ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="adm-section adr-attrbar">
        <button
          type="button"
          className={`adr-attrpill ${attrFilter === 'All' ? 'is-active' : ''}`}
          onClick={() => setAttrFilter('All')}
        >
          All Attributes
        </button>
        {attrChoices.map((a) => {
          const on = attrFilter === a.code
          return (
            <button
              key={a.code}
              type="button"
              className={`adr-attrpill ${on ? 'is-active' : ''}`}
              style={on ? { borderColor: ATTR_COLOR[a.code], color: ATTR_COLOR[a.code] } : undefined}
              onClick={() => setAttrFilter(a.code)}
            >
              <span className="adr-attrpill__dot" style={{ background: ATTR_COLOR[a.code] }} />
              {a.code}
            </button>
          )
        })}
      </section>

      <section className="adm-section adr-tablesection">
        <div className="adr-resultbar">
          <span>
            {visible.length} of {list.length} drills · {activeCount} active in builder
          </span>
          <span>Click a drill to edit its configuration</span>
        </div>

        <div className="adm-tablewrap">
          <div className="adm-thead adr-grid">
            <span>Drill Name</span>
            <span>Target Attributes</span>
            <span>XP / Session</span>
            <span>Volume Caps</span>
            <span>Status</span>
            <span className="adm-th--right">Edit</span>
          </div>

          {loading && <div className="adm-empty"><span className="adm-empty__note">Loading catalogue…</span></div>}
          {loadError && !loading && (
            <div className="adm-empty">
              <span className="adm-empty__title">Couldn't load</span>
              <span className="adm-empty__note">{loadError}</span>
            </div>
          )}

          {!loading && !loadError && visible.map((d) => {
            const pc = primaryCode(d.boosts)
            const pm = attrMeta(pc)
            const sum = totalXp(d.boosts)
            return (
              <div
                key={d.id}
                className="adm-trow adm-trow--clickable adr-grid"
                style={{ opacity: d.active ? 1 : 0.5 }}
                role="button"
                tabIndex={0}
                aria-label={`Edit ${d.name}`}
                onClick={() => openEdit(d)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openEdit(d)
                  }
                }}
              >
                <span className="adr-name" data-label="Drill">
                  <span className="adr-attrsq" style={{ borderColor: pm.color, color: pm.color }}>
                    {pc}
                  </span>
                  <span className="adr-name__id">
                    <span className="adr-name__n">{d.name}</span>
                    <span className="adr-name__meta">
                      {d.category} · {d.code}
                    </span>
                    <span className="adr-name__tags">
                      <span className={`adr-levelpill adr-levelpill--${d.level.toLowerCase()}`}>{d.level}</span>
                      <span className="adr-grouptag">{d.group === 'goalkeeper' ? 'Goalkeeper' : 'Outfield'}</span>
                    </span>
                  </span>
                </span>

                <span className="adr-attrcell" data-label="Target Attributes">
                  {sortedBoosts(d.boosts).map(([code, val]) => {
                    const m = attrMeta(code)
                    return (
                      <span
                        key={code}
                        className="adr-boostchip"
                        style={{ borderColor: m.color, color: m.color }}
                      >
                        <span className="adr-boostchip__v">+{val}</span>
                        {code}
                      </span>
                    )
                  })}
                </span>

                <span className="adr-xp" data-label="XP / Session">
                  <span className="adr-xp__v">+{sum}</span>
                  <span className="adr-xp__sub">
                    {Object.keys(d.boosts).length} attribute{Object.keys(d.boosts).length > 1 ? 's' : ''}
                  </span>
                </span>

                <span className="adr-caps" data-label="Volume Caps">
                  <span className="adr-caps__reps">
                    {d.minReps}–{d.maxReps} reps
                  </span>
                  <span className="adr-caps__sets">
                    {d.minSets}–{d.maxSets} sets
                  </span>
                </span>

                <span data-label="Status">
                  <span className={`adm-pill adm-pill--${d.active ? 'green' : 'grey'}`}>
                    {d.active ? 'Active' : 'Retired'}
                  </span>
                </span>

                <span
                  className="adm-tc--right"
                  data-label="Edit"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button type="button" className="adr-editbtn" aria-label="Edit drill" onClick={() => openEdit(d)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
                    </svg>
                  </button>
                </span>
              </div>
            )
          })}

          {!loading && !loadError && visible.length === 0 && (
            <div className="adm-empty">
              <span className="adm-empty__title">No Drills Match</span>
              <span className="adm-empty__note">Clear the search or the attribute / status filters.</span>
            </div>
          )}
        </div>
      </section>

      {form && (
        <div className="adm-drawer">
          <div className="adm-drawer__scrim" onClick={closeDrawer} />
          <aside className="adm-drawer__panel" role="dialog" aria-modal="true" aria-label={f.isNew ? 'Create new drill' : `Edit ${f.name}`}>
            <div className="adm-drawer__head">
              <span>
                <span className="adm-drawer__eyebrow">{f.isNew ? 'New Catalogue Entry' : 'Edit Drill Configuration'}</span>
                <span className="adm-drawer__title" style={{ display: 'block' }}>
                  {f.isNew ? 'Create New Drill' : f.name || 'Untitled Drill'}
                </span>
                <span className="adm-drawer__sub" style={{ display: 'block' }}>
                  {f.isNew ? 'Code assigned on save' : f.code}
                </span>
              </span>
              <button type="button" className="adm-drawer__close" aria-label="Close" onClick={closeDrawer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="adm-drawer__body">
              <div className="adr-formgrid">
                <label className="adm-field">
                  <span className="adm-field__label">Drill Name</span>
                  <input className="adm-input" type="text" value={f.name} placeholder="e.g. Cone Weave 20m" onChange={(e) => patch('name', e.target.value)} />
                </label>
                <label className="adm-field">
                  <span className="adm-field__label">Category</span>
                  <select className="adm-select" value={f.category} onChange={(e) => patch('category', e.target.value)}>
                    {CATEGORIES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="adr-formgrid">
                <div className="adm-field">
                  <span className="adm-field__label">Difficulty Level</span>
                  <span className="adr-seg">
                    {LEVELS.map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        className={`adr-seg__btn ${f.level === lv ? 'is-on' : ''}`}
                        onClick={() => patch('level', lv)}
                      >
                        {lv}
                      </button>
                    ))}
                  </span>
                </div>
                <div className="adm-field">
                  <span className="adm-field__label">Attribute Group</span>
                  <span className="adr-seg">
                    {['outfield', 'goalkeeper'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`adr-seg__btn ${f.group === g ? 'is-on' : ''}`}
                        onClick={() => setGroup(g)}
                      >
                        {g === 'goalkeeper' ? 'Goalkeeper' : 'Outfield'}
                      </button>
                    ))}
                  </span>
                </div>
              </div>

              <div className="adm-field">
                <span className="adm-field__label">
                  Target Attributes &amp; XP Weight
                  <span className="adr-fieldhint">
                    {noAttr ? 'Pick at least one' : `Total +${totalXp(f.boosts)} XP per approved set`}
                  </span>
                </span>
                <div className="adr-boostgrid">
                  {formAttrs.map((a) => {
                    const on = f.boosts[a.code] != null
                    const val = f.boosts[a.code] || 2
                    const color = ATTR_COLOR[a.code]
                    return (
                      <div
                        key={a.code}
                        className={`adr-boostcard ${on ? 'is-on' : ''}`}
                        style={on ? { borderColor: color } : undefined}
                      >
                        <button type="button" className="adr-boostcard__head" onClick={() => toggleBoost(a.code)}>
                          <span className="adr-boostcard__check" style={{ borderColor: on ? color : 'rgba(148,163,184,0.4)', background: on ? color : 'transparent' }}>
                            {on && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b1020" strokeWidth="3.4">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className="adr-boostcard__id">
                            <span className="adr-boostcard__code" style={{ color: on ? color : '#c7d0e0' }}>{a.code}</span>
                            <span className="adr-boostcard__name">{a.name}</span>
                          </span>
                        </button>
                        {on && (
                          <span className="adr-seg adr-seg--mini">
                            {BOOST_STEPS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={`adr-seg__btn ${val === s ? 'is-on' : ''}`}
                                onClick={() => setBoost(a.code, s)}
                              >
                                +{s}
                              </button>
                            ))}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {!noAttr && (
                  <span className="adr-boostpreview">
                    {sortedBoosts(f.boosts).map(([code, val]) => {
                      const m = attrMeta(code)
                      return (
                        <span key={code} className="adr-boostchip" style={{ borderColor: m.color, color: m.color }}>
                          <span className="adr-boostchip__v">+{val}</span>
                          {code}
                        </span>
                      )
                    })}
                  </span>
                )}
              </div>

              <div className="adr-formgrid">
                <div className="adr-panelbox">
                  <span className="adr-panelbox__k">Reps Allowed</span>
                  <span className="adr-minmax">
                    <label className="adm-field">
                      <span className="adm-field__label">Min</span>
                      <input className="adm-input adr-num" type="number" min="1" max="50" value={f.minReps} onChange={(e) => num('minReps', e.target.value, 1, 50)} />
                    </label>
                    <label className="adm-field">
                      <span className="adm-field__label">Max</span>
                      <input className="adm-input adr-num" type="number" min="1" max="50" value={f.maxReps} style={repsBad ? { borderColor: '#FF2E63' } : undefined} onChange={(e) => num('maxReps', e.target.value, 1, 50)} />
                    </label>
                  </span>
                  <span className="adr-note" style={{ color: repsBad ? '#FF2E63' : '#5A6784' }}>
                    {repsBad ? 'Min cannot exceed max' : 'Session Builder rejects anything outside this range'}
                  </span>
                </div>

                <div className="adr-panelbox">
                  <span className="adr-panelbox__k">Sets Allowed</span>
                  <span className="adr-minmax">
                    <label className="adm-field">
                      <span className="adm-field__label">Min</span>
                      <input className="adm-input adr-num" type="number" min="1" max="12" value={f.minSets} onChange={(e) => num('minSets', e.target.value, 1, 12)} />
                    </label>
                    <label className="adm-field">
                      <span className="adm-field__label">Max</span>
                      <input className="adm-input adr-num" type="number" min="1" max="12" value={f.maxSets} style={setsBad ? { borderColor: '#FF2E63' } : undefined} onChange={(e) => num('maxSets', e.target.value, 1, 12)} />
                    </label>
                  </span>
                  <span className="adr-note" style={{ color: setsBad ? '#FF2E63' : '#5A6784' }}>
                    {setsBad ? 'Min cannot exceed max' : 'Applies per drill, per logged session'}
                  </span>
                </div>
              </div>

              <div className="adm-field">
                <span className="adm-field__label">Demo Video</span>
                <div className="adr-video">
                  <span className="adr-video__frame" />
                  <span className="adr-video__inner">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8">
                      <rect x="2" y="6" width="14" height="12" />
                      <path d="M16 10l6-3v10l-6-3" />
                    </svg>
                    <span className="adr-video__label">{f.video ? 'Demo clip attached' : 'No demo clip attached'}</span>
                    <span className="adr-video__hint">Drop an MP4 or drag from the clip library · 15s max, 1080p</span>
                    <button type="button" className="adr-video__cta" onClick={() => patch('video', !f.video)}>
                      {f.video ? 'Replace Clip' : 'Attach Clip'}
                    </button>
                  </span>
                </div>
              </div>

              <button type="button" className={`adr-activetoggle ${f.active ? 'is-on' : ''}`} onClick={() => patch('active', !f.active)}>
                <span className="adr-activetoggle__text">
                  <span className="adr-activetoggle__label">Active In Player Builder</span>
                  <span className="adr-activetoggle__note">
                    {f.active ? 'Players can select this drill right now' : 'Hidden from the builder — logged history retained'}
                  </span>
                </span>
                <span className={`adm-toggle ${f.active ? 'is-on' : ''}`}>
                  <span className="adm-toggle__knob" />
                </span>
              </button>

              <div className="adr-formactions">
                <button type="button" className="adm-btn adm-btn--indigo" disabled={busy} onClick={save}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {f.isNew ? 'Add Drill To Catalogue' : 'Save Drill Configuration'}
                </button>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={closeDrawer}>
                  Cancel
                </button>
                {!f.isNew && (
                  <button type="button" className="adm-btn adm-btn--danger adr-retire" disabled={busy} onClick={toggleRetire}>
                    {f.active ? 'Retire Drill' : 'Reinstate Drill'}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div className="adm-toast">
          <span className="adm-toast__dot" />
          <span className="adm-toast__msg">{toast}</span>
        </div>
      )}
    </AdminShell>
  )
}
