import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Upload, LayoutGrid, List, Search, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Badge, { STAGE_VARIANT } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { buildWaUrl, scoreColor } from '../lib/utils'
import type { Prospecto, ProspectoStage } from '../types'

const STAGES: ProspectoStage[] = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta enviada', 'Ganado', 'Perdido']

const STAGE_COLORS: Record<string, string> = {
  'Nuevo': '#6b7280',
  'Contactado': '#0094ff',
  'Propuesta enviada': '#fffc00',
  'Reunión': '#00f7ff',
  'Ganado': '#10b981',
  'Perdido': '#ff006b',
}

interface FormData {
  nombre_negocio: string
  contacto: string
  ciudad: string
  nicho: string
  whatsapp: string
  email: string
  website: string
  instagram: string
  score: number
  stage: ProspectoStage
  problemas_detectados: string
  notas: string
}

const EMPTY_FORM: FormData = {
  nombre_negocio: '', contacto: '', ciudad: '', nicho: '',
  whatsapp: '', email: '', website: '', instagram: '',
  score: 0, stage: 'Nuevo', problemas_detectados: '', notas: '',
}

export default function Prospectos() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('prospectos').select('*').order('score', { ascending: false })
    setProspectos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = prospectos.filter(p =>
    !search || p.nombre_negocio.toLowerCase().includes(search.toLowerCase()) ||
    (p.ciudad ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.nicho ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const byStage = (stage: ProspectoStage) => filtered.filter(p => p.stage === stage)

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (p: Prospecto) => {
    setForm({ ...p, problemas_detectados: p.problemas_detectados ?? '', notas: p.notas ?? '',
      contacto: p.contacto ?? '', ciudad: p.ciudad ?? '', nicho: p.nicho ?? '',
      whatsapp: p.whatsapp ?? '', email: p.email ?? '', website: p.website ?? '', instagram: p.instagram ?? '',
    })
    setEditId(p.id)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.nombre_negocio.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('prospectos').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    } else {
      await supabase.from('prospectos').insert({ ...form })
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  const moveStage = async (id: string, stage: ProspectoStage) => {
    await supabase.from('prospectos').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
    setProspectos(prev => prev.map(p => p.id === id ? { ...p, stage } : p))
  }

  const handleDrop = (e: React.DragEvent, stage: ProspectoStage) => {
    e.preventDefault()
    if (dragging) moveStage(dragging, stage)
    setDragging(null)
  }

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
      const rows = lines.slice(1)
      const toInsert = rows.map(row => {
        const vals = row.split(',').map(v => v.trim().replace(/"/g, ''))
        const get = (key: string) => vals[headers.indexOf(key)] ?? ''
        const phone = get('phone') || get('whatsapp') || get('teléfono') || get('telefono')
        const clean = phone.replace(/\D/g, '')
        if (!clean.startsWith('56') || !clean.startsWith('569', 0)) return null
        return {
          nombre_negocio: get('name') || get('nombre') || get('nombre_negocio'),
          whatsapp: clean,
          website: get('website') || get('web'),
          ciudad: get('city') || get('ciudad') || 'Rancagua',
          nicho: get('category') || get('nicho') || '',
          stage: 'Nuevo' as ProspectoStage,
          score: 70,
        }
      }).filter(Boolean)

      if (toInsert.length) {
        const phones = toInsert.map(r => r!.whatsapp)
        const { data: existing } = await supabase.from('prospectos').select('whatsapp').in('whatsapp', phones)
        const existingSet = new Set(existing?.map(e => e.whatsapp) ?? [])
        const nuevos = toInsert.filter((r): r is NonNullable<typeof r> => !!r && !!r.whatsapp && !existingSet.has(r.whatsapp))
        if (nuevos.length) await supabase.from('prospectos').insert(nuevos)
        alert(`${nuevos.length} prospectos importados. ${toInsert.length - nuevos.length} duplicados omitidos.`)
        load()
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const f = (field: keyof FormData, value: string | number) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Prospectos"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
              <button onClick={() => setView('kanban')} className="px-3 py-2 text-xs font-medium transition-colors"
                style={{ background: view === 'kanban' ? '#0094ff' : 'transparent', color: view === 'kanban' ? '#fff' : '#6b7280' }}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setView('list')} className="px-3 py-2 text-xs font-medium transition-colors"
                style={{ background: view === 'list' ? '#0094ff' : 'transparent', color: view === 'list' ? '#fff' : '#6b7280' }}>
                <List size={14} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
            <Button size="sm" icon={<Upload size={13} />} onClick={() => fileRef.current?.click()}>
              <span className="hidden sm:inline">Importar CSV</span>
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openNew}>
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </div>
        }
      />

      {/* Búsqueda */}
      <div className="px-4 sm:px-6 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#111', border: '1px solid #1e1e1e', flex: '1 1 160px', maxWidth: 400 }}>
          <Search size={14} style={{ color: '#6b7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad, nicho…"
            className="bg-transparent text-sm outline-none flex-1" style={{ color: '#e8ecf7' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" />
          </div>
        ) : view === 'kanban' ? (
          /* ── KANBAN ── */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage}
                className="flex-shrink-0 w-64 rounded-2xl p-3 transition-colors"
                style={{ background: '#111', border: `1px solid ${dragging ? STAGE_COLORS[stage] + '44' : '#1e1e1e'}`, minHeight: 400 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      {stage}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#6b7280' }}>
                    {byStage(stage).length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {byStage(stage).map(p => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        draggable
                        onDragStart={() => setDragging(p.id)}
                        onDragEnd={() => setDragging(null)}
                        onClick={() => navigate(`/prospectos/${p.id}`)}
                        className="p-3 rounded-xl cursor-grab active:cursor-grabbing"
                        style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#0094ff44')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-semibold leading-tight" style={{ color: '#e8ecf7' }}>
                            {p.nombre_negocio}
                          </p>
                          <span className="text-xs font-bold ml-2 flex-shrink-0 px-1.5 py-0.5 rounded"
                            style={{ color: scoreColor(p.score), background: scoreColor(p.score) + '18' }}>
                            {p.score}
                          </span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: '#6b7280' }}>{p.ciudad} · {p.nicho}</p>
                        <div className="flex items-center justify-between">
                          {p.whatsapp && (
                            <a href={buildWaUrl(p.whatsapp)} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs"
                              style={{ color: '#25d366' }}>
                              <MessageCircle size={12} /> WA
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── LISTA ── */
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ background: '#111', borderBottom: '1px solid #1e1e1e' }}>
                  {['Negocio', 'Ciudad', 'Nicho', 'WhatsApp', 'Score', 'Etapa', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => navigate(`/prospectos/${p.id}`)}
                    className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid #111' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#111')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#e8ecf7' }}>{p.nombre_negocio}</td>
                    <td className="px-4 py-3" style={{ color: '#9ca3af' }}>{p.ciudad ?? '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#9ca3af' }}>{p.nicho ?? '—'}</td>
                    <td className="px-4 py-3">
                      {p.whatsapp ? (
                        <a href={buildWaUrl(p.whatsapp)} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()} className="text-xs" style={{ color: '#25d366' }}>
                          {p.whatsapp}
                        </a>
                      ) : <span style={{ color: '#6b7280' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-xs" style={{ color: scoreColor(p.score) }}>{p.score}</span>
                    </td>
                    <td className="px-4 py-3"><Badge label={p.stage} variant={STAGE_VARIANT[p.stage]} /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openEdit(p) }}>Editar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-10 text-sm" style={{ color: '#6b7280' }}>Sin prospectos</p>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Modal formulario */}
      <Modal open={showForm} title={editId ? 'Editar prospecto' : 'Nuevo prospecto'} onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre del negocio *" value={form.nombre_negocio} onChange={v => f('nombre_negocio', v)} />
            <Field label="Persona de contacto" value={form.contacto} onChange={v => f('contacto', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Ciudad" value={form.ciudad} onChange={v => f('ciudad', v)} placeholder="Rancagua" />
            <Field label="Nicho" value={form.nicho} onChange={v => f('nicho', v)} placeholder="Comida, Fitness…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="WhatsApp" value={form.whatsapp} onChange={v => f('whatsapp', v)} placeholder="+56 9 XXXX XXXX" />
            <Field label="Email" value={form.email} onChange={v => f('email', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Instagram" value={form.instagram} onChange={v => f('instagram', v)} placeholder="@perfil" />
            <Field label="Sitio web" value={form.website} onChange={v => f('website', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Etapa</label>
              <select value={form.stage} onChange={e => f('stage', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Score (0-100)</label>
              <input type="number" min={0} max={100} value={form.score} onChange={e => f('score', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }} />
            </div>
          </div>
          <Field label="Problemas detectados" value={form.problemas_detectados} onChange={v => f('problemas_detectados', v)} textarea />
          <Field label="Notas" value={form.notas} onChange={v => f('notas', v)} textarea />
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save} loading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, textarea }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean
}) {
  const style = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={style} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={style} />
      )}
    </div>
  )
}
