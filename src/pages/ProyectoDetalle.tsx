import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Check, GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Proyecto, ProyectoEstado, ProyectoTipo, Moneda, Fase } from '../types'

const KANBAN_ESTADOS: ProyectoEstado[] = ['Briefing', 'En diseño', 'En desarrollo', 'Revisión', 'Entregado']
const TODOS_ESTADOS: ProyectoEstado[] = [...KANBAN_ESTADOS, 'Pausado', 'Cancelado']
const TIPOS: ProyectoTipo[] = ['Landing page', 'E-commerce', 'Branding', 'Community Manager', 'Auditoría SEO', 'Modificación de productos', 'Otro']
const MONEDAS: Moneda[] = ['CLP', 'USD', 'VES']
const ESTADO_COLOR: Record<string, string> = {
  'Briefing': '#6b7280', 'En diseño': '#0094ff', 'En desarrollo': '#8b5cf6',
  'Revisión': '#fffc00', 'Entregado': '#10b981', 'Pausado': '#f97316', 'Cancelado': '#ff006b',
}
const TIPO_COLOR: Record<string, string> = {
  'Landing page': '#0094ff', 'E-commerce': '#8b5cf6', 'Branding': '#ff006b',
  'Community Manager': '#fffc00', 'Auditoría SEO': '#10b981',
  'Modificación de productos': '#00f7ff', 'Otro': '#6b7280',
}

export default function ProyectoDetalle() {
  const { id } = useParams<{ id: string }>()
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [newFase, setNewFase] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Proyecto>>({})
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    const { data } = await supabase
      .from('proyectos').select('*, clientes(nombre_negocio)').eq('id', id!).single()
    if (data) {
      const p = { ...data, fases: data.fases ?? [], cliente_nombre: (data as any).clientes?.nombre_negocio ?? null }
      setProyecto(p)
      setClienteNombre((data as any).clientes?.nombre_negocio ?? '')
    }
  }
  useEffect(() => { if (id) load() }, [id])

  const updateFases = async (fases: Fase[]) => {
    setProyecto(p => p ? { ...p, fases } : p)
    await supabase.from('proyectos').update({ fases }).eq('id', id!)
  }

  const toggleFase = (i: number) => {
    if (!proyecto) return
    const fases = proyecto.fases.map((f, idx) => idx === i ? { ...f, completada: !f.completada } : f)
    updateFases(fases)
  }

  const addFase = () => {
    if (!newFase.trim() || !proyecto) return
    updateFases([...proyecto.fases, { nombre: newFase.trim(), completada: false }])
    setNewFase('')
  }

  const removeFase = (i: number) => {
    if (!proyecto) return
    updateFases(proyecto.fases.filter((_, idx) => idx !== i))
  }

  const changeEstado = async (estado: ProyectoEstado) => {
    setProyecto(p => p ? { ...p, estado } : p)
    await supabase.from('proyectos').update({ estado }).eq('id', id!)
  }

  const openEdit = () => {
    if (!proyecto) return
    setEditForm({
      nombre: proyecto.nombre, tipo: proyecto.tipo, descripcion: proyecto.descripcion ?? '',
      estado: proyecto.estado, fecha_inicio: proyecto.fecha_inicio ?? '',
      fecha_entrega: proyecto.fecha_entrega ?? '', monto_total: proyecto.monto_total ?? undefined,
      moneda: proyecto.moneda, monto_cobrado: proyecto.monto_cobrado, notas: proyecto.notas ?? '',
    })
    setShowEdit(true)
  }

  const saveEdit = async () => {
    if (!editForm.nombre?.trim()) return
    setSaving(true)
    await supabase.from('proyectos').update({
      ...editForm,
      fecha_inicio: editForm.fecha_inicio || null,
      fecha_entrega: editForm.fecha_entrega || null,
    }).eq('id', id!)
    setSaving(false); setShowEdit(false); load()
  }

  const del = async () => {
    if (!window.confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return
    await supabase.from('proyectos').delete().eq('id', id!)
    navigate('/proyectos')
  }

  if (!proyecto) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" />
    </div>
  )

  const fasesOk = proyecto.fases.filter(f => f.completada).length
  const fasesTotal = proyecto.fases.length
  const pct = fasesTotal ? Math.round((fasesOk / fasesTotal) * 100) : 0
  const pagoPct = proyecto.monto_total ? Math.min(100, (proyecto.monto_cobrado / proyecto.monto_total) * 100) : 0
  const pendiente = (proyecto.monto_total ?? 0) - proyecto.monto_cobrado
  const tipoColor = TIPO_COLOR[proyecto.tipo ?? 'Otro'] ?? '#6b7280'
  const estadoColor = ESTADO_COLOR[proyecto.estado] ?? '#6b7280'

  const inp = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={proyecto.nombre}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={openEdit}>Editar</Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={del} />
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => navigate('/proyectos')} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0094ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          <ArrowLeft size={16} /> Volver a proyectos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Info del proyecto */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{proyecto.nombre}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {proyecto.tipo && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: tipoColor + '22', color: tipoColor }}>
                        {proyecto.tipo}
                      </span>
                    )}
                    {clienteNombre && (
                      <button onClick={() => navigate(`/clientes/${proyecto.cliente_id}`)}
                        className="text-xs px-2.5 py-1 rounded-full transition-colors"
                        style={{ background: '#0094ff11', color: '#0094ff' }}>
                        👤 {clienteNombre}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector de estado */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>Etapa del proyecto</p>
                <div className="flex gap-2 flex-wrap">
                  {TODOS_ESTADOS.map(e => (
                    <button key={e} onClick={() => changeEstado(e)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: proyecto.estado === e ? ESTADO_COLOR[e] : '#1a1a1a',
                        color: proyecto.estado === e ? '#fff' : '#6b7280',
                        border: `1px solid ${proyecto.estado === e ? ESTADO_COLOR[e] : '#1e1e1e'}`,
                      }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <IR label="Inicio" value={proyecto.fecha_inicio ? formatDate(proyecto.fecha_inicio) : null} />
                <IR label="Entrega" value={proyecto.fecha_entrega ? formatDate(proyecto.fecha_entrega) : null} />
              </div>
              {proyecto.descripcion && (
                <p className="mt-3 text-sm" style={{ color: '#9ca3af' }}>{proyecto.descripcion}</p>
              )}
            </div>

            {/* Checklist de fases */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Fases del proyecto</h3>
                  {fasesTotal > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{fasesOk} de {fasesTotal} completadas · {pct}%</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {fasesTotal > 0 && (
                <div className="mb-4 h-2 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #0094ff, #00f7ff)' }} />
                </div>
              )}

              {/* Fases list */}
              <div className="space-y-2 mb-4">
                {proyecto.fases.map((fase, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl group transition-colors"
                    style={{ background: '#0d0d0d', border: `1px solid ${fase.completada ? '#10b98133' : '#1a1a1a'}` }}>
                    <button onClick={() => toggleFase(i)}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: fase.completada ? '#10b981' : '#333', background: fase.completada ? '#10b981' : 'transparent' }}>
                      {fase.completada && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>
                    <span className="flex-1 text-sm" style={{ color: fase.completada ? '#6b7280' : '#e8ecf7', textDecoration: fase.completada ? 'line-through' : 'none' }}>
                      {fase.nombre}
                    </span>
                    <button onClick={() => removeFase(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ color: '#ff006b' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {fasesTotal === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: '#6b7280' }}>Sin fases — agrega una abajo</p>
                )}
              </div>

              {/* Add fase */}
              <div className="flex gap-2">
                <input value={newFase} onChange={e => setNewFase(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addFase()}
                  placeholder="Nueva fase…" className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={inp} />
                <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={addFase}>Agregar</Button>
              </div>
            </div>
          </div>

          {/* Sidebar derecho */}
          <div className="space-y-4">
            {/* Tracker de pago */}
            {proyecto.monto_total && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Pagos</h3>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Total</span>
                    <span style={{ color: '#e8ecf7' }}>{formatCurrency(proyecto.monto_total, proyecto.moneda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Cobrado</span>
                    <span style={{ color: '#10b981' }}>{formatCurrency(proyecto.monto_cobrado, proyecto.moneda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Pendiente</span>
                    <span style={{ color: pendiente > 0 ? '#fffc00' : '#10b981' }}>{formatCurrency(pendiente, proyecto.moneda)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pagoPct}%`, background: pagoPct >= 100 ? '#10b981' : 'linear-gradient(90deg, #8b5cf6, #0094ff)' }} />
                </div>
                <p className="text-xs mt-2 text-center" style={{ color: '#6b7280' }}>{Math.round(pagoPct)}% cobrado</p>
              </div>
            )}

            {/* Notas */}
            {proyecto.notas && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>Notas</h3>
                <p className="text-sm" style={{ color: '#9ca3af' }}>{proyecto.notas}</p>
              </div>
            )}

            {/* Fechas */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Fechas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>Creado</span>
                  <span style={{ color: '#9ca3af' }}>{formatDate(proyecto.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>Entrega</span>
                  <span style={{ color: '#9ca3af' }}>{proyecto.fecha_entrega ? formatDate(proyecto.fecha_entrega) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal edición */}
      <Modal open={showEdit} title="Editar proyecto" onClose={() => setShowEdit(false)}>
        <div className="space-y-3">
          <EF label="Nombre *" value={editForm.nombre ?? ''} onChange={v => setEditForm(p => ({ ...p, nombre: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Tipo</label>
              <select value={editForm.tipo ?? ''} onChange={e => setEditForm(p => ({ ...p, tipo: e.target.value as ProyectoTipo }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Moneda</label>
              <select value={editForm.moneda ?? 'CLP'} onChange={e => setEditForm(p => ({ ...p, moneda: e.target.value as Moneda }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp}>
                {MONEDAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EF label="Fecha inicio" value={editForm.fecha_inicio ?? ''} onChange={v => setEditForm(p => ({ ...p, fecha_inicio: v }))} type="date" />
            <EF label="Fecha entrega" value={editForm.fecha_entrega ?? ''} onChange={v => setEditForm(p => ({ ...p, fecha_entrega: v }))} type="date" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EF label="Monto total" value={String(editForm.monto_total ?? '')} onChange={v => setEditForm(p => ({ ...p, monto_total: Number(v) || undefined }))} type="number" />
            <EF label="Cobrado" value={String(editForm.monto_cobrado ?? 0)} onChange={v => setEditForm(p => ({ ...p, monto_cobrado: Number(v) || 0 }))} type="number" />
          </div>
          <EF label="Notas" value={editForm.notas ?? ''} onChange={v => setEditForm(p => ({ ...p, notas: v }))} textarea />
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveEdit} loading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function IR({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</p>
      <p className="mt-0.5 text-sm" style={{ color: value ? '#e8ecf7' : '#444' }}>{value ?? '—'}</p>
    </div>
  )
}

function EF({ label, value, onChange, type, textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean
}) {
  const s = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={s} />
        : <input value={value} onChange={e => onChange(e.target.value)} type={type ?? 'text'} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={s} />}
    </div>
  )
}
