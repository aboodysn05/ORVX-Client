import { useState } from 'react'
import { AdminShell } from '../components/layout/AdminShell'
import '../styles/admin-drills.css'

// Admin Global Drill Catalogue Configuration — translated from
// OVRX Admin Drills.dc.html. Frontend only: mock catalogue, local overrides
// applied on save, an edit/create drawer and a transient toast.

const ATTRS = [
  { code: 'PAC', name: 'Pace', color: '#10B981' },
  { code: 'SHO', name: 'Shooting', color: '#FF2E63' },
  { code: 'PAS', name: 'Passing', color: '#4F46E5' },
  { code: 'DRI', name: 'Dribbling', color: '#F59E0B' },
  { code: 'DEF', name: 'Defending', color: '#A5B0FF' },
  { code: 'PHY', name: 'Physical', color: '#E8ECF5' },
]
const attrOf = (code) => ATTRS.find((a) => a.code === code) || ATTRS[0]

const CATEGORIES = ['Sprint & Agility', 'Finishing', 'Ball Control', 'Passing & Vision', 'Defensive Shape', 'Strength & Conditioning', 'Goalkeeping']

const DRILLS = [
  { id: 'd1', code: 'DRL-014', name: 'Cone Weave 20m', category: 'Ball Control', attr: 'DRI', xp: 2, minReps: 4, maxReps: 20, minSets: 1, maxSets: 4, active: true, video: true },
  { id: 'd2', code: 'DRL-021', name: 'Sprint Ladder 40m', category: 'Sprint & Agility', attr: 'PAC', xp: 3, minReps: 2, maxReps: 12, minSets: 2, maxSets: 5, active: true, video: true },
  { id: 'd3', code: 'DRL-007', name: 'First-Time Finish', category: 'Finishing', attr: 'SHO', xp: 2, minReps: 5, maxReps: 20, minSets: 1, maxSets: 4, active: true, video: true },
  { id: 'd4', code: 'DRL-033', name: 'Wall Pass Rebound', category: 'Passing & Vision', attr: 'PAS', xp: 1, minReps: 10, maxReps: 20, minSets: 1, maxSets: 3, active: true, video: false },
  { id: 'd5', code: 'DRL-045', name: 'Jockey & Recover', category: 'Defensive Shape', attr: 'DEF', xp: 2, minReps: 4, maxReps: 16, minSets: 2, maxSets: 4, active: true, video: true },
  { id: 'd6', code: 'DRL-052', name: 'Loaded Carry Shuttle', category: 'Strength & Conditioning', attr: 'PHY', xp: 3, minReps: 3, maxReps: 10, minSets: 2, maxSets: 6, active: true, video: false },
  { id: 'd7', code: 'DRL-002', name: 'Static Cone Touch', category: 'Ball Control', attr: 'DRI', xp: 1, minReps: 8, maxReps: 20, minSets: 1, maxSets: 3, active: false, video: true },
  { id: 'd8', code: 'DRL-058', name: 'Reaction Save Drill', category: 'Goalkeeping', attr: 'DEF', xp: 3, minReps: 5, maxReps: 18, minSets: 2, maxSets: 5, active: true, video: true },
  { id: 'd9', code: 'DRL-011', name: 'Long Range Curler', category: 'Finishing', attr: 'SHO', xp: 3, minReps: 4, maxReps: 14, minSets: 1, maxSets: 4, active: false, video: false },
]

export function AdminDrillsPage() {
  const [attrFilter, setAttrFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [overrides, setOverrides] = useState({})
  const [editing, setEditing] = useState(null) // drill id | 'new' | null
  const [form, setForm] = useState(null)
  const [toast, setToast] = useState('')

  function fire(msg) {
    setToast(msg)
    clearTimeout(fire._t)
    fire._t = setTimeout(() => setToast(''), 2600)
  }

  const merged = (d) => ({ ...d, ...(overrides[d.id] || {}) })
  const list = DRILLS.map(merged)

  const visible = list.filter((d) => {
    if (attrFilter !== 'All' && d.attr !== attrFilter) return false
    if (statusFilter === 'Active' && !d.active) return false
    if (statusFilter === 'Retired' && d.active) return false
    return true
  })

  function openEdit(d) {
    const m = merged(d)
    setEditing(d.id)
    setForm({ ...m, isNew: false })
  }
  function openCreate() {
    setEditing('new')
    setForm({ name: '', category: CATEGORIES[0], attr: 'PAC', xp: 2, minReps: 4, maxReps: 20, minSets: 1, maxSets: 4, active: true, video: false, code: 'DRL-NEW', isNew: true })
  }
  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const num = (k, v, lo, hi) => {
    const n = parseInt(v, 10)
    patch(k, Number.isNaN(n) ? lo : Math.max(lo, Math.min(hi, n)))
  }

  const f = form || {}
  const repsBad = f.minReps > f.maxReps
  const setsBad = f.minSets > f.maxSets

  function save() {
    if (repsBad || setsBad) return fire('Fix the min/max conflict before saving')
    if (!f.name.trim()) return fire('Drill name is required')
    if (editing !== 'new') {
      setOverrides((prev) => ({ ...prev, [editing]: { ...form } }))
    }
    setEditing(null)
    setForm(null)
    fire(`${f.name} saved · caps live in builder`)
  }

  return (
    <AdminShell footerNote="OVRX Admin Console · Drill Catalogue" footerRight="Caps apply to sessions built after saving">
      <section className="adm-section">
        <div className="adm-herorow">
          <div className="adm-herocopy">
            <span className="adm-kicker">Single Source · Read By Drills &amp; Session Builder</span>
            <h1 className="adm-title">Global Drill Catalogue Configuration</h1>
            <p className="adm-lead">
              XP weight and volume caps set here govern every session a player can build. Retiring a
              drill removes it from the builder without touching sessions already logged against it.
            </p>
          </div>
          <button type="button" className="adm-btn" onClick={openCreate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create New Drill
          </button>
        </div>
      </section>

      <section className="adm-section adr-filters">
        {['All', ...ATTRS.map((a) => a.code)].map((code) => {
          const on = attrFilter === code
          const color = code === 'All' ? '#FF2E63' : attrOf(code).color
          return (
            <button
              key={code}
              type="button"
              className={`adm-chipbtn ${on ? 'is-active' : ''}`}
              style={on ? { borderColor: color, color } : undefined}
              onClick={() => setAttrFilter(code)}
            >
              {code === 'All' ? 'All Attributes' : code}
            </button>
          )
        })}
        <span className="adr-statusfilters">
          {['All', 'Active', 'Retired'].map((label) => (
            <button
              key={label}
              type="button"
              className={`adm-chipbtn ${statusFilter === label ? 'is-active-indigo' : ''}`}
              onClick={() => setStatusFilter(label)}
            >
              {label}
            </button>
          ))}
        </span>
      </section>

      <section className="adm-section adr-tablesection">
        <div className="adr-resultbar">
          <span>
            {visible.length} of {DRILLS.length} drills · {list.filter((d) => d.active).length} active in builder
          </span>
          <span>Click a drill to edit its configuration</span>
        </div>

        <div className="adm-tablewrap">
          <div className="adm-thead adr-grid">
            <span>Drill Name</span>
            <span>Target Attribute</span>
            <span>XP Weight</span>
            <span>Volume Caps</span>
            <span>Status</span>
            <span className="adm-th--right">Edit</span>
          </div>

          {visible.map((d) => {
            const a = attrOf(d.attr)
            return (
              <div key={d.id} className="adm-trow adm-trow--clickable adr-grid" style={{ opacity: d.active ? 1 : 0.5 }} onClick={() => openEdit(d)}>
                <span className="adr-name">
                  <span className="adr-attrsq" style={{ borderColor: a.color, color: a.color }}>
                    {d.attr}
                  </span>
                  <span className="adr-name__id">
                    <span className="adr-name__n">{d.name}</span>
                    <span className="adr-name__meta">
                      {d.category} · {d.code}
                    </span>
                  </span>
                </span>

                <span className="adr-target">
                  <span className="adr-target__n" style={{ color: a.color }}>
                    {a.name}
                  </span>
                  <span className="adr-target__bar" style={{ background: a.color }} />
                </span>

                <span className="adr-xp">
                  <span className="adr-xp__v">+{d.xp}</span>
                  <span className="adr-xp__pips">
                    {[1, 2, 3].map((n) => (
                      <span key={n} className="adr-xp__pip" style={{ background: n <= d.xp ? a.color : 'rgba(148,163,184,0.2)' }} />
                    ))}
                  </span>
                </span>

                <span className="adr-caps">
                  <span className="adr-caps__reps">
                    {d.minReps}–{d.maxReps} reps
                  </span>
                  <span className="adr-caps__sets">
                    {d.minSets}–{d.maxSets} sets
                  </span>
                </span>

                <span>
                  <span className={`adm-pill adm-pill--${d.active ? 'green' : 'grey'}`}>{d.active ? 'Active' : 'Retired'}</span>
                </span>

                <span className="adm-tc--right" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="adr-editbtn" aria-label="Edit drill" onClick={() => openEdit(d)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
                    </svg>
                  </button>
                </span>
              </div>
            )
          })}

          {visible.length === 0 && (
            <div className="adm-empty">
              <span className="adm-empty__title">No Drills Match</span>
              <span className="adm-empty__note">Clear the attribute or status filter.</span>
            </div>
          )}
        </div>
      </section>

      {form && (
        <div className="adm-drawer">
          <div className="adm-drawer__scrim" onClick={() => { setEditing(null); setForm(null) }} />
          <aside className="adm-drawer__panel">
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
              <button type="button" className="adm-drawer__close" aria-label="Close" onClick={() => { setEditing(null); setForm(null) }}>
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

              <div className="adm-field">
                <span className="adm-field__label">Target Attribute</span>
                <span className="adr-attrchoices">
                  {ATTRS.map((a) => {
                    const on = f.attr === a.code
                    return (
                      <button
                        key={a.code}
                        type="button"
                        className="adr-attrchoice"
                        style={{ borderColor: on ? a.color : 'rgba(79,70,229,0.28)', color: on ? a.color : '#8B97AF', background: on ? 'rgba(79,70,229,0.16)' : 'rgba(9,13,22,0.75)' }}
                        onClick={() => patch('attr', a.code)}
                      >
                        <span className="adr-attrchoice__code">{a.code}</span>
                        <span className="adr-attrchoice__name">{a.name}</span>
                      </button>
                    )
                  })}
                </span>
              </div>

              <div className="adr-panelbox">
                <span className="adr-panelbox__row">
                  <span className="adr-panelbox__k">XP Weight Per Approved Set</span>
                  <span className="adr-panelbox__v">+{f.xp}</span>
                </span>
                <input type="range" min="1" max="3" step="1" value={f.xp} onChange={(e) => patch('xp', parseInt(e.target.value, 10))} className="adr-range" />
                <span className="adr-rangelabels">
                  <span>+1 Light</span>
                  <span>+2 Standard</span>
                  <span>+3 Intensive</span>
                </span>
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
                <button type="button" className="adm-btn adm-btn--indigo" onClick={save}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Save Drill Configuration
                </button>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { setEditing(null); setForm(null) }}>
                  Cancel
                </button>
                {!f.isNew && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--danger adr-retire"
                    onClick={() => {
                      const next = !f.active
                      patch('active', next)
                      fire(`${f.name}${next ? ' reinstated' : ' retired — hidden from builder'}`)
                    }}
                  >
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
