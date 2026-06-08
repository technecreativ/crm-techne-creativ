import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Send, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Badge, { STAGE_VARIANT } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { formatDate, formatCurrency } from '../lib/utils'
import type { Propuesta, PropuestaEstado, Moneda, ServicioPropuesta } from '../types'

const ESTADOS: PropuestaEstado[] = ['Borrador', 'Enviada', 'Aceptada', 'Rechazada']
const MONEDAS: Moneda[] = ['CLP', 'USD', 'VES']

const EMPTY_PROP: Omit<Propuesta, 'id' | 'created_at' | 'sent_at'> = {
  titulo: '', prospecto_id: null, cliente_id: null,
  servicios: [], monto_total: null, moneda: 'CLP',
  estado: 'Borrador', drive_url: null, notas: null,
}

export default function PropuestaDetalle() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'nueva' || !id
  const [prop, setProp] = useState<typeof EMPTY_PROP & { id?: string; created_at?: string; sent_at?: string | null }>(EMPTY_PROP)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNew && id) {
      supabase.from('propuestas').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setProp(data)
      })
    }
  }, [id, isNew])

  const addServicio = () => setProp(p => ({ ...p, servicios: [...p.servicios, { nombre: '', descripcion: '', precio: 0 }] }))

  const updateServicio = (i: number, field: keyof ServicioPropuesta, val: string | number) =>
    setProp(p => {
      const s = [...p.servicios]; s[i] = { ...s[i], [field]: val }
      const total = s.reduce((acc, sv) => acc + Number(sv.precio), 0)
      return { ...p, servicios: s, monto_total: total }
    })

  const removeServicio = (i: number) =>
    setProp(p => {
      const s = p.servicios.filter((_, idx) => idx !== i)
      return { ...p, servicios: s, monto_total: s.reduce((acc, sv) => acc + Number(sv.precio), 0) }
    })

  const save = async () => {
    if (!prop.titulo.trim()) return
    setSaving(true)
    if (isNew) {
      const { data } = await supabase.from('propuestas').insert(prop).select().single()
      if (data) navigate(`/propuestas/${data.id}`, { replace: true })
    } else {
      await supabase.from('propuestas').update(prop).eq('id', id!)
    }
    setSaving(false)
  }

  const changeEstado = async (estado: PropuestaEstado) => {
    const update: Record<string, unknown> = { estado }
    if (estado === 'Enviada' && !prop.sent_at) update.sent_at = new Date().toISOString()
    setProp(p => ({ ...p, ...update }))
    if (!isNew) await supabase.from('propuestas').update(update).eq('id', id!)
  }

  const input = (k: string, v: string | null) => setProp(p => ({ ...p, [k]: v }))

  const inp = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={isNew ? 'Nueva propuesta' : prop.titulo || 'Propuesta'}
        actions={
          <div className="flex items-center gap-2">
            {!isNew && ESTADOS.map(e => (
              <button key={e} onClick={() => changeEstado(e)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: prop.estado === e ? '#0094ff' : '#111', color: prop.estado === e ? '#fff' : '#6b7280', border: '1px solid #1e1e1e' }}>
                {e}
              </button>
            ))}
            <Button variant="primary" size="sm" icon={<Send size={13} />} onClick={save} loading={saving}>
              {isNew ? 'Crear' : 'Guardar'}
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => navigate('/propuestas')} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0094ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
          <ArrowLeft size={16} /> Volver a propuestas
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Datos básicos */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Datos generales</h3>
                {prop.estado && <Badge label={prop.estado} variant={STAGE_VARIANT[prop.estado]} />}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Título *</label>
                  <input value={prop.titulo} onChange={e => input('titulo', e.target.value)}
                    placeholder="Propuesta de servicios web para…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Moneda</label>
                    <select value={prop.moneda} onChange={e => input('moneda', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inp}>
                      {MONEDAS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Link Drive (PDF)</label>
                    <div className="flex gap-2">
                      <input value={prop.drive_url ?? ''} onChange={e => input('drive_url', e.target.value || null)}
                        placeholder="https://drive.google.com/…" className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inp} />
                      {prop.drive_url && (
                        <a href={prop.drive_url} target="_blank" rel="noreferrer"
                          className="px-3 py-2.5 rounded-xl flex items-center" style={{ background: '#1e1e1e', color: '#6b7280' }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Notas / Condiciones</label>
                  <textarea value={prop.notas ?? ''} onChange={e => input('notas', e.target.value || null)} rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={inp} />
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Servicios / Ítems</h3>
                <Button size="sm" variant="secondary" icon={<Plus size={12} />} onClick={addServicio}>Agregar</Button>
              </div>
              {prop.servicios.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#6b7280' }}>Sin ítems — haz clic en "Agregar"</p>
              ) : (
                <div className="space-y-3">
                  {prop.servicios.map((s, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                      <div className="flex gap-2 mb-2">
                        <input value={s.nombre} onChange={e => updateServicio(i, 'nombre', e.target.value)}
                          placeholder="Nombre del servicio" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={inp} />
                        <input type="number" value={s.precio} onChange={e => updateServicio(i, 'precio', Number(e.target.value))}
                          placeholder="0" className="w-28 px-3 py-2 rounded-lg text-sm outline-none" style={inp} />
                        <button onClick={() => removeServicio(i)} className="px-2 py-2 rounded-lg transition-colors"
                          style={{ color: '#ff006b', background: '#ff006b11' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input value={s.descripcion} onChange={e => updateServicio(i, 'descripcion', e.target.value)}
                        placeholder="Descripción del ítem" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inp} />
                    </div>
                  ))}
                </div>
              )}
              {prop.monto_total !== null && prop.monto_total > 0 && (
                <div className="flex justify-end mt-4 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>Total</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Syne', color: '#10b981' }}>
                      {formatCurrency(prop.monto_total, prop.moneda)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {!isNew && (
              <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>Historial</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Creada</span>
                    <span style={{ color: '#9ca3af' }}>{prop.created_at ? formatDate(prop.created_at) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Enviada</span>
                    <span style={{ color: '#9ca3af' }}>{prop.sent_at ? formatDate(prop.sent_at) : '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
