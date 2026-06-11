import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Send, ExternalLink, Upload, FileText, X, Loader2 } from 'lucide-react'
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
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const uploadFile = async (file: File) => {
    const allowed = ['application/pdf', 'text/html']
    if (!allowed.includes(file.type)) {
      alert('Solo se permiten archivos PDF o HTML')
      return
    }
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('propuestas').upload(path, file, { contentType: file.type })
    if (error) { alert('Error al subir el archivo: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('propuestas').getPublicUrl(path)
    setProp(p => ({ ...p, drive_url: publicUrl }))
    if (!isNew && id) await supabase.from('propuestas').update({ drive_url: publicUrl }).eq('id', id)
    setUploading(false)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const removeArchivo = async () => {
    setProp(p => ({ ...p, drive_url: null }))
    if (!isNew && id) await supabase.from('propuestas').update({ drive_url: null }).eq('id', id)
  }

  const inp = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }

  const isUploadedFile = (url: string | null) =>
    url?.includes('supabase') && url.includes('/propuestas/')

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
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Monto total</label>
                    <input
                      type="number"
                      min={0}
                      value={prop.monto_total ?? ''}
                      onChange={e => setProp(p => ({ ...p, monto_total: e.target.value === '' ? null : Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inp}
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Archivo de propuesta</label>
                    <input ref={fileInputRef} type="file" accept=".html,.pdf" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />

                    {prop.drive_url ? (
                      /* ── Archivo o URL cargado ── */
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: '#0d0d0d', border: '1px solid #0094ff33' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(0,148,255,0.12)' }}>
                          <FileText size={15} style={{ color: '#0094ff' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#e8ecf7' }}>
                            {isUploadedFile(prop.drive_url)
                              ? decodeURIComponent(prop.drive_url.split('/').pop()?.replace(/^\d+-/, '') ?? 'Archivo')
                              : 'Link externo'}
                          </p>
                          <p className="text-xs truncate" style={{ color: '#6b7280' }}>{prop.drive_url}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <a href={prop.drive_url} target="_blank" rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                            style={{ background: 'rgba(0,148,255,0.12)', color: '#0094ff' }}>
                            <ExternalLink size={12} /> Ver
                          </a>
                          <button onClick={removeArchivo} className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#6b7280' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ff006b')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Zona de drop + opciones ── */
                      <div>
                        <div
                          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleFileDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: dragOver ? 'rgba(0,148,255,0.08)' : '#0a0a0a',
                            border: `1.5px dashed ${dragOver ? '#0094ff' : '#2a2a2a'}`,
                          }}>
                          {uploading
                            ? <Loader2 size={20} className="animate-spin" style={{ color: '#0094ff' }} />
                            : <Upload size={20} style={{ color: dragOver ? '#0094ff' : '#4b5563' }} />}
                          <p className="text-sm" style={{ color: dragOver ? '#0094ff' : '#6b7280' }}>
                            {uploading ? 'Subiendo archivo…' : 'Arrastrá o clic para subir PDF o HTML'}
                          </p>
                          <p className="text-xs" style={{ color: '#374151' }}>Máx. 10 MB</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-px" style={{ background: '#1e1e1e' }} />
                          <span className="text-xs" style={{ color: '#374151' }}>o pegar URL</span>
                          <div className="flex-1 h-px" style={{ background: '#1e1e1e' }} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input value={prop.drive_url ?? ''} onChange={e => input('drive_url', e.target.value || null)}
                            placeholder="https://drive.google.com/…"
                            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inp} />
                        </div>
                      </div>
                    )}
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
