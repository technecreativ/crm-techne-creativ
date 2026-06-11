import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Check, Wrench, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Badge, { STAGE_VARIANT } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ContactButtons from '../components/shared/ContactButtons'
import { formatDate, formatCurrency } from '../lib/utils'
import type { Cliente, Proyecto, Tarea, TareaTipo, Adicional, AdicionalEstado, Moneda, ProyectoEstado } from '../types'

// ─── Proyectos ────────────────────────────────────────────────────────────────
const TIPOS_PROJ = ['Landing page', 'E-commerce', 'Branding', 'SEO', 'Community Manager', 'Catálogo WhatsApp', 'Otro']
const ESTADOS_PROJ: ProyectoEstado[] = ['Briefing', 'En diseño', 'En desarrollo', 'Revisión', 'Entregado', 'Pausado', 'Cancelado']
const MONEDAS: Moneda[] = ['CLP', 'USD', 'VES']

interface ProjForm {
  nombre: string; tipo: string; descripcion: string; estado: ProyectoEstado
  fecha_inicio: string; fecha_entrega: string; monto_total: string; moneda: Moneda; monto_cobrado: string; notas: string
}
const EMPTY_P: ProjForm = { nombre: '', tipo: 'Landing page', descripcion: '', estado: 'Briefing', fecha_inicio: '', fecha_entrega: '', monto_total: '', moneda: 'CLP', monto_cobrado: '0', notas: '' }

// ─── Tareas ───────────────────────────────────────────────────────────────────
const TIPOS_TAREA: TareaTipo[] = ['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Tarea']
const TIPO_ICON: Record<TareaTipo, string> = { 'Llamada': '📞', 'WhatsApp': '💬', 'Email': '📧', 'Reunión': '🤝', 'Tarea': '✅' }

// ─── Adicionales ──────────────────────────────────────────────────────────────
const ESTADOS_ADIC: AdicionalEstado[] = ['Pendiente', 'Cotizado', 'Aprobado', 'En proceso', 'Completado', 'Rechazado']
const ADIC_COLOR: Record<AdicionalEstado, string> = {
  'Pendiente':   '#6b7280',
  'Cotizado':    '#0094ff',
  'Aprobado':    '#10b981',
  'En proceso':  '#8b5cf6',
  'Completado':  '#00f7ff',
  'Rechazado':   '#ff006b',
}

interface AdicForm { titulo: string; descripcion: string; estado: AdicionalEstado; monto: string; moneda: Moneda }
const EMPTY_A: AdicForm = { titulo: '', descripcion: '', estado: 'Pendiente', monto: '', moneda: 'CLP' }

const ESTADOS_CLIENTE: Cliente['estado'][] = ['Kickoff', 'En producción', 'Revisión', 'Entregado', 'Pausado']

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  'Kickoff':       { bg: 'rgba(0,247,255,0.12)',   color: '#00f7ff' },
  'En producción': { bg: 'rgba(0,148,255,0.12)',   color: '#0094ff' },
  'Revisión':      { bg: 'rgba(255,252,0,0.12)',   color: '#fffc00' },
  'Entregado':     { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  'Pausado':       { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
}

interface ClienteForm {
  nombre_negocio: string; contacto: string; ciudad: string; whatsapp: string
  email: string; servicio: string; estado: Cliente['estado']; drive_folder_url: string; notas: string
}

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [adicionales, setAdicionales] = useState<Adicional[]>([])

  // modales
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<ClienteForm>({ nombre_negocio: '', contacto: '', ciudad: '', whatsapp: '', email: '', servicio: '', estado: 'Kickoff', drive_folder_url: '', notas: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  const [showProj, setShowProj] = useState(false)
  const [projForm, setProjForm] = useState<ProjForm>(EMPTY_P)
  const [editProjId, setEditProjId] = useState<string | null>(null)
  const [savingProj, setSavingProj] = useState(false)

  const [showTarea, setShowTarea] = useState(false)
  const [tForm, setTForm] = useState({ titulo: '', tipo: 'Tarea' as TareaTipo, fecha_limite: '' })
  const [savingT, setSavingT] = useState(false)

  const [showAdic, setShowAdic] = useState(false)
  const [adicForm, setAdicForm] = useState<AdicForm>(EMPTY_A)
  const [editAdicId, setEditAdicId] = useState<string | null>(null)
  const [savingA, setSavingA] = useState(false)

  // ── loaders ──────────────────────────────────────────────────────────────
  const loadProyectos = async () => {
    const { data } = await supabase.from('proyectos').select('*').eq('cliente_id', id!).order('created_at', { ascending: false })
    setProyectos(data ?? [])
  }
  const loadTareas = async () => {
    const { data } = await supabase.from('tareas').select('*').eq('cliente_id', id!).order('created_at', { ascending: false })
    setTareas(data ?? [])
  }
  const loadAdicionales = async () => {
    const { data } = await supabase.from('adicionales').select('*').eq('cliente_id', id!).order('created_at', { ascending: false })
    setAdicionales(data ?? [])
  }

  const openEdit = () => {
    if (!cliente) return
    setEditForm({
      nombre_negocio: cliente.nombre_negocio,
      contacto: cliente.contacto ?? '',
      ciudad: cliente.ciudad ?? '',
      whatsapp: cliente.whatsapp ?? '',
      email: cliente.email ?? '',
      servicio: cliente.servicio ?? '',
      estado: cliente.estado,
      drive_folder_url: cliente.drive_folder_url ?? '',
      notas: cliente.notas ?? '',
    })
    setShowEdit(true)
  }

  const saveEdit = async () => {
    setSavingEdit(true)
    const payload = {
      ...editForm,
      contacto: editForm.contacto || null,
      ciudad: editForm.ciudad || null,
      whatsapp: editForm.whatsapp || null,
      email: editForm.email || null,
      servicio: editForm.servicio || null,
      drive_folder_url: editForm.drive_folder_url || null,
      notas: editForm.notas || null,
    }
    await supabase.from('clientes').update(payload).eq('id', id!)
    setSavingEdit(false)
    setShowEdit(false)
    supabase.from('clientes').select('*').eq('id', id!).single().then(({ data }) => setCliente(data))
  }

  useEffect(() => {
    if (!id) return
    supabase.from('clientes').select('*').eq('id', id).single().then(({ data }) => setCliente(data))
    loadProyectos()
    loadTareas()
    loadAdicionales()
  }, [id])

  // ── proyectos ─────────────────────────────────────────────────────────────
  const pf = (k: keyof ProjForm, v: string) => setProjForm(p => ({ ...p, [k]: v }))
  const saveProj = async () => {
    if (!projForm.nombre.trim()) return
    setSavingProj(true)
    const payload = { ...projForm, cliente_id: id, monto_total: projForm.monto_total ? Number(projForm.monto_total) : null, monto_cobrado: Number(projForm.monto_cobrado) || 0 }
    if (editProjId) await supabase.from('proyectos').update(payload).eq('id', editProjId)
    else await supabase.from('proyectos').insert(payload)
    setSavingProj(false); setShowProj(false); loadProyectos()
  }
  const openEditProj = (p: Proyecto) => {
    setProjForm({ nombre: p.nombre, tipo: p.tipo ?? '', descripcion: p.descripcion ?? '', estado: p.estado,
      fecha_inicio: p.fecha_inicio ?? '', fecha_entrega: p.fecha_entrega ?? '',
      monto_total: p.monto_total?.toString() ?? '', moneda: p.moneda, monto_cobrado: p.monto_cobrado.toString(), notas: p.notas ?? '' })
    setEditProjId(p.id); setShowProj(true)
  }
  const deleteProj = async (projId: string) => {
    if (!window.confirm('¿Eliminar proyecto?')) return
    await supabase.from('proyectos').delete().eq('id', projId)
    loadProyectos()
  }

  // ── tareas ────────────────────────────────────────────────────────────────
  const saveTarea = async () => {
    if (!tForm.titulo.trim()) return
    setSavingT(true)
    await supabase.from('tareas').insert({ ...tForm, cliente_id: id, completada: false, fecha_limite: tForm.fecha_limite || null })
    setSavingT(false); setShowTarea(false)
    setTForm({ titulo: '', tipo: 'Tarea', fecha_limite: '' })
    loadTareas()
  }
  const toggleTarea = async (t: Tarea) => {
    await supabase.from('tareas').update({ completada: !t.completada }).eq('id', t.id)
    loadTareas()
  }

  // ── adicionales ───────────────────────────────────────────────────────────
  const af = (k: keyof AdicForm, v: string) => setAdicForm(a => ({ ...a, [k]: v }))
  const saveAdic = async () => {
    if (!adicForm.titulo.trim()) return
    setSavingA(true)
    const payload = { ...adicForm, cliente_id: id, monto: adicForm.monto ? Number(adicForm.monto) : null }
    if (editAdicId) await supabase.from('adicionales').update(payload).eq('id', editAdicId)
    else await supabase.from('adicionales').insert(payload)
    setSavingA(false); setShowAdic(false); loadAdicionales()
  }
  const openEditAdic = (a: Adicional) => {
    setAdicForm({ titulo: a.titulo, descripcion: a.descripcion ?? '', estado: a.estado, monto: a.monto?.toString() ?? '', moneda: a.moneda })
    setEditAdicId(a.id); setShowAdic(true)
  }
  const deleteAdic = async (adicId: string) => {
    if (!window.confirm('¿Eliminar este adicional?')) return
    await supabase.from('adicionales').delete().eq('id', adicId)
    loadAdicionales()
  }
  const changeEstadoAdic = async (a: Adicional, estado: AdicionalEstado) => {
    await supabase.from('adicionales').update({ estado }).eq('id', a.id)
    loadAdicionales()
  }

  const changeEstadoCliente = async (estado: Cliente['estado']) => {
    await supabase.from('clientes').update({ estado }).eq('id', id!)
    setCliente(prev => prev ? { ...prev, estado } : prev)
  }

  const deleteCliente = async () => {
    if (!window.confirm(`¿Eliminar el cliente "${cliente?.nombre_negocio}"? Esta acción no se puede deshacer.`)) return
    await supabase.from('clientes').delete().eq('id', id!)
    navigate('/clientes')
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (!cliente) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title={cliente.nombre_negocio}
        actions={
          <div className="flex items-center gap-2">
            <ContactButtons whatsapp={cliente.whatsapp} email={cliente.email} driveUrl={cliente.drive_folder_url} calendarTitle={`Reunión con ${cliente.nombre_negocio}`} size="md" />
            <Button size="sm" variant="secondary" icon={<Pencil size={13} />} onClick={openEdit}>Editar</Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={deleteCliente} />
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <button onClick={() => navigate('/clientes')} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0094ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          <ArrowLeft size={16} /> Volver a clientes
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* ── Info ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{cliente.nombre_negocio}</h2>
                <select
                  value={cliente.estado}
                  onChange={e => changeEstadoCliente(e.target.value as Cliente['estado'])}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full outline-none cursor-pointer transition-all"
                  style={{
                    background: ESTADO_STYLE[cliente.estado]?.bg ?? 'rgba(107,114,128,0.15)',
                    color: ESTADO_STYLE[cliente.estado]?.color ?? '#9ca3af',
                    border: 'none',
                  }}>
                  {ESTADOS_CLIENTE.map(s => (
                    <option key={s} value={s} style={{ background: '#0a0a0a', color: '#e8ecf7' }}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <IR label="Contacto" value={cliente.contacto} />
                <IR label="Ciudad" value={cliente.ciudad} />
                <IR label="Servicio" value={cliente.servicio} />
                <IR label="Desde" value={formatDate(cliente.created_at)} />
              </div>
              {cliente.notas && <p className="mt-3 text-sm" style={{ color: '#9ca3af' }}>{cliente.notas}</p>}
            </div>

            {/* ── Proyectos ────────────────────────────────────────────── */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Proyectos</h3>
                <Button size="sm" variant="primary" icon={<Plus size={12} />}
                  onClick={() => { setProjForm(EMPTY_P); setEditProjId(null); setShowProj(true) }}>
                  Nuevo
                </Button>
              </div>
              {proyectos.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#6b7280' }}>Sin proyectos aún</p>
              ) : (
                <div className="space-y-3">
                  {proyectos.map(p => {
                    const pct = p.monto_total ? Math.min(100, (p.monto_cobrado / p.monto_total) * 100) : 0
                    const pendiente = (p.monto_total ?? 0) - p.monto_cobrado
                    return (
                      <div key={p.id} className="p-4 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: '#e8ecf7' }}>{p.nombre}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{p.tipo} · {p.estado}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                            <Badge label={p.estado} variant={STAGE_VARIANT[p.estado]} />
                            <Button size="sm" variant="ghost" onClick={() => openEditProj(p)}>Editar</Button>
                            <Button size="sm" variant="danger" icon={<Trash2 size={11} />} onClick={() => deleteProj(p.id)} />
                          </div>
                        </div>
                        {p.monto_total && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span style={{ color: '#6b7280' }}>Cobrado: <span style={{ color: '#10b981' }}>{formatCurrency(p.monto_cobrado, p.moneda)}</span></span>
                              <span style={{ color: '#6b7280' }}>Pendiente: <span style={{ color: pendiente > 0 ? '#fffc00' : '#10b981' }}>{formatCurrency(pendiente, p.moneda)}</span></span>
                              <span style={{ color: '#6b7280' }}>Total: <span style={{ color: '#e8ecf7' }}>{formatCurrency(p.monto_total, p.moneda)}</span></span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : '#0094ff' }} />
                            </div>
                          </div>
                        )}
                        {p.fecha_entrega && <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Entrega: {formatDate(p.fecha_entrega)}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Adicionales ──────────────────────────────────────────── */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#8b5cf618' }}>
                    <Wrench size={13} style={{ color: '#8b5cf6' }} />
                  </div>
                  <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Adicionales</h3>
                </div>
                <Button size="sm" variant="secondary" icon={<Plus size={12} />}
                  onClick={() => { setAdicForm(EMPTY_A); setEditAdicId(null); setShowAdic(true) }}>
                  Nueva solicitud
                </Button>
              </div>
              {adicionales.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#6b7280' }}>Sin trabajos adicionales registrados</p>
              ) : (
                <div className="space-y-2">
                  {adicionales.map(a => (
                    <div key={a.id} className="p-4 rounded-xl" style={{ background: '#0d0d0d', border: `1px solid ${ADIC_COLOR[a.estado]}22` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: ADIC_COLOR[a.estado] + '22', color: ADIC_COLOR[a.estado] }}>
                              {a.estado}
                            </span>
                            {a.monto && (
                              <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                {formatCurrency(a.monto, a.moneda)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium" style={{ color: '#e8ecf7' }}>{a.titulo}</p>
                          {a.descripcion && <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{a.descripcion}</p>}
                          <p className="text-xs mt-1.5" style={{ color: '#444' }}>{formatDate(a.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <select
                            value={a.estado}
                            onChange={e => changeEstadoAdic(a, e.target.value as AdicionalEstado)}
                            className="text-xs px-2 py-1.5 rounded-lg outline-none"
                            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#9ca3af' }}>
                            {ESTADOS_ADIC.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <Button size="sm" variant="ghost" onClick={() => openEditAdic(a)}>Editar</Button>
                          <Button size="sm" variant="danger" icon={<Trash2 size={11} />} onClick={() => deleteAdic(a.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Tareas de seguimiento ────────────────────────────────── */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Tareas de seguimiento</h3>
                <Button size="sm" variant="secondary" icon={<Plus size={12} />} onClick={() => setShowTarea(true)}>Nueva</Button>
              </div>
              {tareas.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#6b7280' }}>Sin tareas — crea una para dar seguimiento</p>
              ) : (
                <div className="space-y-2">
                  {tareas.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: '#0d0d0d', border: `1px solid ${!t.completada && t.fecha_limite && new Date(t.fecha_limite) < new Date() ? '#ff006b33' : '#1a1a1a'}` }}>
                      <button onClick={() => toggleTarea(t)}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: t.completada ? '#10b981' : '#333', background: t.completada ? '#10b981' : 'transparent' }}>
                        {t.completada && <Check size={10} color="#fff" strokeWidth={3} />}
                      </button>
                      <span className="text-sm flex-shrink-0">{TIPO_ICON[t.tipo]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate"
                          style={{ color: t.completada ? '#6b7280' : '#e8ecf7', textDecoration: t.completada ? 'line-through' : 'none' }}>
                          {t.titulo}
                        </p>
                        {t.fecha_limite && <p className="text-xs" style={{ color: '#6b7280' }}>{formatDate(t.fecha_limite)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Acciones rápidas</h3>
              <div className="space-y-2">
                {cliente.whatsapp && (
                  <a href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}>
                    Abrir WhatsApp
                  </a>
                )}
                {cliente.drive_folder_url && (
                  <a href={cliente.drive_folder_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,252,0,0.1)', color: '#fffc00', border: '1px solid rgba(255,252,0,0.2)' }}>
                    Abrir Drive
                  </a>
                )}
                <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Reunión con ' + cliente.nombre_negocio)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(0,247,255,0.1)', color: '#00f7ff', border: '1px solid rgba(0,247,255,0.2)' }}>
                  Agendar en Calendar
                </a>
              </div>
            </div>

            {/* Resumen adicionales */}
            {adicionales.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Resumen adicionales</h3>
                <div className="space-y-2">
                  {ESTADOS_ADIC.map(est => {
                    const count = adicionales.filter(a => a.estado === est).length
                    if (count === 0) return null
                    return (
                      <div key={est} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: ADIC_COLOR[est] }} />
                          <span style={{ color: '#9ca3af' }}>{est}</span>
                        </div>
                        <span className="font-bold" style={{ color: '#e8ecf7' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Editar cliente ────────────────────────────────────────────── */}
      <Modal open={showEdit} title="Editar cliente" onClose={() => setShowEdit(false)}>
        <div className="space-y-3">
          <F label="Nombre del negocio *" value={editForm.nombre_negocio} onChange={v => setEditForm(f => ({ ...f, nombre_negocio: v }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Contacto" value={editForm.contacto} onChange={v => setEditForm(f => ({ ...f, contacto: v }))} />
            <F label="Ciudad" value={editForm.ciudad} onChange={v => setEditForm(f => ({ ...f, ciudad: v }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="WhatsApp" value={editForm.whatsapp} onChange={v => setEditForm(f => ({ ...f, whatsapp: v }))} />
            <F label="Email" value={editForm.email} onChange={v => setEditForm(f => ({ ...f, email: v }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Servicio contratado" value={editForm.servicio} onChange={v => setEditForm(f => ({ ...f, servicio: v }))} />
            <Sel label="Estado" value={editForm.estado} onChange={v => setEditForm(f => ({ ...f, estado: v as Cliente['estado'] }))} opts={ESTADOS_CLIENTE} />
          </div>
          <F label="Link carpeta Drive" value={editForm.drive_folder_url} onChange={v => setEditForm(f => ({ ...f, drive_folder_url: v }))} placeholder="https://drive.google.com/..." />
          <F label="Notas" value={editForm.notas} onChange={v => setEditForm(f => ({ ...f, notas: v }))} textarea />
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveEdit} loading={savingEdit}>Guardar cambios</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Proyecto ─────────────────────────────────────────────────── */}
      <Modal open={showProj} title={editProjId ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={() => setShowProj(false)}>
        <div className="space-y-3">
          <F label="Nombre del proyecto *" value={projForm.nombre} onChange={v => pf('nombre', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Sel label="Tipo" value={projForm.tipo} onChange={v => pf('tipo', v)} opts={TIPOS_PROJ} />
            <Sel label="Estado" value={projForm.estado} onChange={v => pf('estado', v as ProyectoEstado)} opts={ESTADOS_PROJ} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Fecha inicio" value={projForm.fecha_inicio} onChange={v => pf('fecha_inicio', v)} type="date" />
            <F label="Fecha entrega" value={projForm.fecha_entrega} onChange={v => pf('fecha_entrega', v)} type="date" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <F label="Monto total" value={projForm.monto_total} onChange={v => pf('monto_total', v)} type="number" />
            <F label="Cobrado" value={projForm.monto_cobrado} onChange={v => pf('monto_cobrado', v)} type="number" />
            <Sel label="Moneda" value={projForm.moneda} onChange={v => pf('moneda', v)} opts={MONEDAS} />
          </div>
          <F label="Descripción" value={projForm.descripcion} onChange={v => pf('descripcion', v)} textarea />
          <F label="Notas" value={projForm.notas} onChange={v => pf('notas', v)} textarea />
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowProj(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveProj} loading={savingProj}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Adicional ─────────────────────────────────────────────────── */}
      <Modal open={showAdic} title={editAdicId ? 'Editar adicional' : 'Nueva solicitud adicional'} onClose={() => setShowAdic(false)} maxWidth={460}>
        <div className="space-y-3">
          <F label="Título *" value={adicForm.titulo} onChange={v => af('titulo', v)} placeholder="Ej: Banner para Instagram" />
          <F label="Descripción" value={adicForm.descripcion} onChange={v => af('descripcion', v)} textarea placeholder="Describe qué necesita el cliente..." />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Sel label="Estado" value={adicForm.estado} onChange={v => af('estado', v as AdicionalEstado)} opts={ESTADOS_ADIC} />
            </div>
            <F label="Monto cotizado" value={adicForm.monto} onChange={v => af('monto', v)} type="number" />
            <Sel label="Moneda" value={adicForm.moneda} onChange={v => af('moneda', v)} opts={MONEDAS} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowAdic(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveAdic} loading={savingA}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Tarea ─────────────────────────────────────────────────────── */}
      <Modal open={showTarea} title="Nueva tarea" onClose={() => setShowTarea(false)} maxWidth={420}>
        <div className="space-y-3">
          <F label="Título *" value={tForm.titulo} onChange={v => setTForm(f => ({ ...f, titulo: v }))} placeholder="Ej: Llamar para seguimiento" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Sel label="Tipo" value={tForm.tipo} onChange={v => setTForm(f => ({ ...f, tipo: v as TareaTipo }))} opts={TIPOS_TAREA} />
            <F label="Fecha límite" value={tForm.fecha_limite} onChange={v => setTForm(f => ({ ...f, fecha_limite: v }))} type="date" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowTarea(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveTarea} loading={savingT}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── helpers de formulario ────────────────────────────────────────────────────
function IR({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</p>
      <p className="mt-0.5" style={{ color: value ? '#e8ecf7' : '#444' }}>{value ?? '—'}</p>
    </div>
  )
}
function F({ label, value, onChange, type, textarea, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string
}) {
  const s = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={s} />
        : <input value={value} onChange={e => onChange(e.target.value)} type={type ?? 'text'} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={s} />}
    </div>
  )
}
function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
