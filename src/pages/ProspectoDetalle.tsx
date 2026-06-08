import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, UserCheck, Plus, Check, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ContactButtons from '../components/shared/ContactButtons'
import { formatDate, scoreColor } from '../lib/utils'
import type { Prospecto, Tarea, TareaTipo, ProspectoStage } from '../types'

const TIPOS: TareaTipo[] = ['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Tarea']
const TIPO_ICON: Record<TareaTipo, string> = { 'Llamada': '📞', 'WhatsApp': '💬', 'Email': '📧', 'Reunión': '🤝', 'Tarea': '✅' }

const STAGES: ProspectoStage[] = ['Nuevo', 'Contactado', 'Propuesta enviada', 'Reunión', 'Ganado', 'Perdido']
const STAGE_COLORS: Record<string, string> = {
  'Nuevo': '#6b7280',
  'Contactado': '#0094ff',
  'Propuesta enviada': '#fffc00',
  'Reunión': '#00f7ff',
  'Ganado': '#10b981',
  'Perdido': '#ff006b',
}
const NEXT_STAGE: Partial<Record<ProspectoStage, ProspectoStage>> = {
  'Nuevo': 'Contactado',
  'Contactado': 'Propuesta enviada',
  'Propuesta enviada': 'Reunión',
  'Reunión': 'Ganado',
}

export default function ProspectoDetalle() {
  const { id } = useParams<{ id: string }>()
  const [p, setP] = useState<Prospecto | null>(null)
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [showTarea, setShowTarea] = useState(false)
  const [tForm, setTForm] = useState({ titulo: '', tipo: 'Tarea' as TareaTipo, fecha_limite: '', descripcion: '' })
  const [savingT, setSavingT] = useState(false)
  const navigate = useNavigate()

  const loadTareas = async () => {
    const { data } = await supabase.from('tareas').select('*').eq('prospecto_id', id!).order('created_at', { ascending: false })
    setTareas(data ?? [])
  }

  useEffect(() => {
    if (!id) return
    supabase.from('prospectos').select('*').eq('id', id).single().then(({ data }) => setP(data))
    loadTareas()
  }, [id])

  const saveTarea = async () => {
    if (!tForm.titulo.trim()) return
    setSavingT(true)
    await supabase.from('tareas').insert({ ...tForm, prospecto_id: id, completada: false, fecha_limite: tForm.fecha_limite || null })
    setSavingT(false)
    setShowTarea(false)
    setTForm({ titulo: '', tipo: 'Tarea', fecha_limite: '', descripcion: '' })
    loadTareas()
  }

  const toggleTarea = async (t: Tarea) => {
    await supabase.from('tareas').update({ completada: !t.completada }).eq('id', t.id)
    loadTareas()
  }

  const changeStage = async (stage: ProspectoStage) => {
    if (!p || p.stage === stage) return
    await supabase.from('prospectos').update({ stage, updated_at: new Date().toISOString() }).eq('id', p.id)
    setP(prev => prev ? { ...prev, stage } : prev)
  }

  const convertToCliente = async () => {
    if (!p) return
    const { data } = await supabase.from('clientes').insert({
      prospecto_id: p.id,
      nombre_negocio: p.nombre_negocio,
      contacto: p.contacto,
      ciudad: p.ciudad,
      whatsapp: p.whatsapp,
      email: p.email,
      servicio: 'Pendiente definir',
      estado: 'Kickoff',
    }).select().single()
    await supabase.from('prospectos').update({ stage: 'Ganado', updated_at: new Date().toISOString() }).eq('id', p.id)
    if (data) navigate(`/clientes/${data.id}`)
  }

  const eliminar = async () => {
    if (!window.confirm('¿Eliminar este prospecto?')) return
    await supabase.from('prospectos').delete().eq('id', id!)
    navigate('/prospectos')
  }

  if (!p) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={p.nombre_negocio}
        actions={
          <div className="flex items-center gap-2">
            <ContactButtons whatsapp={p.whatsapp} email={p.email} size="md" />
            {p.stage !== 'Ganado' && (
              <Button variant="primary" size="sm" icon={<UserCheck size={13} />} onClick={convertToCliente}>
                Convertir a cliente
              </Button>
            )}
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={eliminar} />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <button
          onClick={() => navigate('/prospectos')}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0094ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
        >
          <ArrowLeft size={16} /> Volver a prospectos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-6" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{p.nombre_negocio}</h2>
                  <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{p.ciudad} · {p.nicho}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={p.stage}
                    onChange={e => changeStage(e.target.value as ProspectoStage)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold outline-none cursor-pointer transition-all"
                    style={{
                      background: `${STAGE_COLORS[p.stage]}18`,
                      color: STAGE_COLORS[p.stage],
                      border: `1px solid ${STAGE_COLORS[p.stage]}50`,
                    }}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-2xl font-bold" style={{ color: scoreColor(p.score) }}>{p.score}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <InfoRow label="Contacto" value={p.contacto} />
                <InfoRow label="WhatsApp" value={p.whatsapp} />
                <InfoRow label="Email" value={p.email} />
                <InfoRow label="Instagram" value={p.instagram} />
                <InfoRow label="Sitio web" value={p.website} />
                <InfoRow label="Creado" value={formatDate(p.created_at)} />
              </div>
            </div>

            {p.problemas_detectados && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#fffc00' }}>⚠ Problemas detectados</h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#9ca3af' }}>{p.problemas_detectados}</p>
              </div>
            )}

            {p.notas && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#6b7280' }}>Notas</h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#9ca3af' }}>{p.notas}</p>
              </div>
            )}

            {/* Tareas vinculadas */}
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

          {/* Panel lateral */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Acciones rápidas</h3>
              <div className="space-y-2">
                {p.whatsapp && (
                  <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}>
                    Abrir WhatsApp
                  </a>
                )}
                {p.email && (
                  <a href={`https://mail.google.com/mail/?view=cm&to=${p.email}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(0,148,255,0.1)', color: '#0094ff', border: '1px solid rgba(0,148,255,0.2)' }}>
                    Enviar email
                  </a>
                )}
                <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Reunión con ${encodeURIComponent(p.nombre_negocio)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(0,247,255,0.1)', color: '#00f7ff', border: '1px solid rgba(0,247,255,0.2)' }}>
                  Agendar reunión
                </a>
              </div>
            </div>

            {/* Avanzar etapa */}
            {NEXT_STAGE[p.stage] && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Siguiente etapa</h3>
                <button
                  onClick={() => changeStage(NEXT_STAGE[p.stage]!)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: `${STAGE_COLORS[NEXT_STAGE[p.stage]!]}18`,
                    color: STAGE_COLORS[NEXT_STAGE[p.stage]!],
                    border: `1px solid ${STAGE_COLORS[NEXT_STAGE[p.stage]!]}40`,
                  }}
                >
                  <span>Mover a "{NEXT_STAGE[p.stage]}"</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Todas las etapas */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Cambiar etapa</h3>
              <div className="flex flex-wrap gap-2">
                {STAGES.filter(s => s !== 'Ganado').map(s => (
                  <button
                    key={s}
                    onClick={() => changeStage(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: p.stage === s ? `${STAGE_COLORS[s]}25` : 'transparent',
                      color: p.stage === s ? STAGE_COLORS[s] : '#4b5563',
                      border: `1px solid ${p.stage === s ? STAGE_COLORS[s] + '50' : '#1e1e1e'}`,
                      fontWeight: p.stage === s ? 700 : 400,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showTarea} title="Nueva tarea" onClose={() => setShowTarea(false)} maxWidth={420}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Título *</label>
            <input
              value={tForm.titulo}
              onChange={e => setTForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Llamar para seguimiento"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Tipo</label>
              <select
                value={tForm.tipo}
                onChange={e => setTForm(f => ({ ...f, tipo: e.target.value as TareaTipo }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}
              >
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Fecha límite</label>
              <input
                type="date"
                value={tForm.fecha_limite}
                onChange={e => setTForm(f => ({ ...f, fecha_limite: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}
              />
            </div>
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

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#6b7280' }}>{label}</p>
      <p style={{ color: value ? '#e8ecf7' : '#444' }}>{value ?? '—'}</p>
    </div>
  )
}
