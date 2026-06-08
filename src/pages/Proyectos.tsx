import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'
import type { Proyecto, ProyectoEstado, ProyectoTipo, Moneda, Fase } from '../types'

const KANBAN_COLS: ProyectoEstado[] = ['Briefing', 'En diseño', 'En desarrollo', 'Revisión', 'Entregado']
const COL_COLOR: Record<string, string> = {
  'Briefing': '#6b7280', 'En diseño': '#0094ff', 'En desarrollo': '#8b5cf6',
  'Revisión': '#fffc00', 'Entregado': '#10b981',
}
const TIPOS: ProyectoTipo[] = ['Landing page', 'E-commerce', 'Branding', 'Community Manager', 'Auditoría SEO', 'Modificación de productos', 'Otro']
const TIPO_COLOR: Record<string, string> = {
  'Landing page': '#0094ff', 'E-commerce': '#8b5cf6', 'Branding': '#ff006b',
  'Community Manager': '#fffc00', 'Auditoría SEO': '#10b981',
  'Modificación de productos': '#00f7ff', 'Otro': '#6b7280',
}
const MONEDAS: Moneda[] = ['CLP', 'USD', 'VES']

const FASES_DEFAULT: Record<string, string[]> = {
  'Landing page': ['Briefing', 'Wireframe', 'Diseño', 'Desarrollo', 'Revisión', 'Entrega'],
  'E-commerce': ['Briefing', 'Diseño', 'Desarrollo', 'QA / Pruebas', 'Carga de productos', 'Entrega'],
  'Branding': ['Briefing', 'Investigación', 'Bocetos', 'Propuesta de marca', 'Revisión', 'Archivos finales'],
  'Community Manager': ['Briefing', 'Estrategia', 'Calendario de contenido', 'Publicaciones mes 1', 'Reporte mensual'],
  'Auditoría SEO': ['Briefing', 'Análisis técnico', 'Análisis de contenido', 'Informe', 'Implementación'],
  'Modificación de productos': ['Briefing', 'Análisis', 'Implementación', 'Revisión', 'Entrega'],
  'Otro': ['Briefing', 'Desarrollo', 'Revisión', 'Entrega'],
}

interface FormData {
  nombre: string; tipo: ProyectoTipo; descripcion: string
  estado: ProyectoEstado; fecha_inicio: string; fecha_entrega: string
  monto_total: string; moneda: Moneda; monto_cobrado: string
  cliente_id: string; notas: string
}
const EMPTY: FormData = {
  nombre: '', tipo: 'Landing page', descripcion: '', estado: 'Briefing',
  fecha_inicio: '', fecha_entrega: '', monto_total: '', moneda: 'CLP',
  monto_cobrado: '0', cliente_id: '', notas: '',
}

export default function Proyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<{ id: string; nombre_negocio: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const [{ data: proys }, { data: cls }] = await Promise.all([
      supabase.from('proyectos').select('*, clientes(nombre_negocio)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nombre_negocio').order('nombre_negocio'),
    ])
    setProyectos((proys ?? []).map((p: any) => ({
      ...p, fases: p.fases ?? [],
      cliente_nombre: p.clientes?.nombre_negocio ?? null,
    })))
    setClientes(cls ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const f = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.nombre.trim() || !form.cliente_id) return
    setSaving(true)
    const fases: Fase[] = (FASES_DEFAULT[form.tipo] ?? []).map(n => ({ nombre: n, completada: false }))
    await supabase.from('proyectos').insert({
      ...form,
      monto_total: form.monto_total ? Number(form.monto_total) : null,
      monto_cobrado: Number(form.monto_cobrado) || 0,
      fecha_inicio: form.fecha_inicio || null,
      fecha_entrega: form.fecha_entrega || null,
      fases,
    })
    setSaving(false); setShowForm(false); load()
  }

  const moveEstado = async (id: string, estado: ProyectoEstado) => {
    setProyectos(p => p.map(x => x.id === id ? { ...x, estado } : x))
    await supabase.from('proyectos').update({ estado }).eq('id', id)
  }

  const filtered = proyectos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.cliente_nombre ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const byCol = (col: ProyectoEstado) => filtered.filter(p => p.estado === col)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Proyectos"
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <Search size={14} style={{ color: '#6b7280' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto…"
                className="bg-transparent text-sm outline-none w-32" style={{ color: '#e8ecf7' }} />
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => { setForm(EMPTY); setShowForm(true) }}>
              <span className="hidden sm:inline">Nuevo proyecto</span>
            </Button>
          </div>
        }
      />

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-4 p-6" style={{ minWidth: `${KANBAN_COLS.length * 300}px` }}>
          {KANBAN_COLS.map(col => (
            <div key={col} className="flex flex-col flex-shrink-0 w-72"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                if (dragging) moveEstado(dragging, col)
                setDragging(null)
              }}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COL_COLOR[col] }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{col}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#6b7280' }}>
                  {byCol(col).length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {byCol(col).map(p => (
                  <ProyectoCard key={p.id} proyecto={p}
                    onDragStart={() => setDragging(p.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => navigate(`/proyectos/${p.id}`)}
                    colColor={COL_COLOR[col]}
                    tipoColor={TIPO_COLOR[p.tipo ?? 'Otro'] ?? '#6b7280'}
                  />
                ))}
                {byCol(col).length === 0 && (
                  <div className="rounded-xl border-2 border-dashed flex items-center justify-center py-8"
                    style={{ borderColor: '#1a1a1a' }}>
                    <p className="text-xs" style={{ color: '#333' }}>Sin proyectos</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nuevo proyecto */}
      <Modal open={showForm} title="Nuevo proyecto" onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <F label="Nombre del proyecto *" value={form.nombre} onChange={v => f('nombre', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Cliente *</label>
              <select value={form.cliente_id} onChange={e => f('cliente_id', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp}>
                <option value="">Seleccionar cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_negocio}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Tipo</label>
              <select value={form.tipo} onChange={e => f('tipo', e.target.value as ProyectoTipo)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Fecha inicio" value={form.fecha_inicio} onChange={v => f('fecha_inicio', v)} type="date" />
            <F label="Fecha entrega" value={form.fecha_entrega} onChange={v => f('fecha_entrega', v)} type="date" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <F label="Monto total" value={form.monto_total} onChange={v => f('monto_total', v)} type="number" />
            <F label="Cobrado" value={form.monto_cobrado} onChange={v => f('monto_cobrado', v)} type="number" />
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Moneda</label>
              <select value={form.moneda} onChange={e => f('moneda', e.target.value as Moneda)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp}>
                {MONEDAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <F label="Notas" value={form.notas} onChange={v => f('notas', v)} textarea />
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Las fases se generan automáticamente según el tipo de proyecto.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save} loading={saving}>Crear proyecto</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const inp = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }

function ProyectoCard({ proyecto: p, onDragStart, onDragEnd, onClick, colColor, tipoColor }: {
  proyecto: Proyecto; onDragStart: () => void; onDragEnd: () => void
  onClick: () => void; colColor: string; tipoColor: string
}) {
  const fasesTotal = p.fases.length
  const fasesOk = p.fases.filter(f => f.completada).length
  const pct = fasesTotal ? Math.round((fasesOk / fasesTotal) * 100) : 0
  const pagoPct = p.monto_total ? Math.min(100, (p.monto_cobrado / p.monto_total) * 100) : 0

  return (
    <motion.div layout draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      whileHover={{ y: -2 }} className="rounded-xl p-4 cursor-pointer"
      style={{ background: '#111', border: '1px solid #1e1e1e', borderTop: `2px solid ${colColor}` }}>
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-sm leading-tight flex-1 pr-2" style={{ color: '#e8ecf7' }}>{p.nombre}</p>
        {p.tipo && (
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
            style={{ background: tipoColor + '22', color: tipoColor }}>
            {p.tipo}
          </span>
        )}
      </div>
      {p.cliente_nombre && (
        <p className="text-xs mb-3" style={{ color: '#6b7280' }}>👤 {p.cliente_nombre}</p>
      )}
      {fasesTotal > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#6b7280' }}>
            <span>Fases</span><span>{fasesOk}/{fasesTotal}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#0094ff' }} />
          </div>
        </div>
      )}
      {p.monto_total && (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: '#6b7280' }}>
            <span>Pago</span>
            <span style={{ color: pagoPct >= 100 ? '#10b981' : '#fffc00' }}>
              {formatCurrency(p.monto_cobrado, p.moneda)} / {formatCurrency(p.monto_total, p.moneda)}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pagoPct}%`, background: pagoPct >= 100 ? '#10b981' : '#8b5cf6' }} />
          </div>
        </div>
      )}
      {p.fecha_entrega && (
        <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
          📅 Entrega: {new Date(p.fecha_entrega).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
        </p>
      )}
    </motion.div>
  )
}

function F({ label, value, onChange, type, textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={inp} />
        : <input value={value} onChange={e => onChange(e.target.value)} type={type ?? 'text'} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp} />}
    </div>
  )
}
