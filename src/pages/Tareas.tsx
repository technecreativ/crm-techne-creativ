import { useEffect, useState } from 'react'
import { Plus, Check, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import type { Tarea, TareaTipo } from '../types'

const TIPOS: TareaTipo[] = ['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Tarea']
const TIPO_ICON: Record<TareaTipo, string> = {
  'Llamada': '📞', 'WhatsApp': '💬', 'Email': '📧', 'Reunión': '🤝', 'Tarea': '✅'
}

interface FormData {
  titulo: string; descripcion: string; tipo: TareaTipo; fecha_limite: string
}
const EMPTY: FormData = { titulo: '', descripcion: '', tipo: 'Tarea', fecha_limite: '' }

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'completadas'>('pendientes')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('tareas').select('*').order('fecha_limite', { ascending: true, nullsFirst: false })
    setTareas(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = tareas.filter(t => {
    const q = search.toLowerCase()
    const matchQ = !q || t.titulo.toLowerCase().includes(q)
    const matchF = filtro === 'todas' || (filtro === 'pendientes' ? !t.completada : t.completada)
    return matchQ && matchF
  })

  const toggle = async (t: Tarea) => {
    await supabase.from('tareas').update({ completada: !t.completada }).eq('id', t.id)
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, completada: !x.completada } : x))
  }

  const f = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    const data = { ...form, fecha_limite: form.fecha_limite || null }
    if (editId) {
      await supabase.from('tareas').update(data).eq('id', editId)
    } else {
      await supabase.from('tareas').insert({ ...data, completada: false })
    }
    setSaving(false); setShowForm(false); load()
  }

  const openEdit = (t: Tarea) => {
    setForm({ titulo: t.titulo, descripcion: t.descripcion ?? '', tipo: t.tipo, fecha_limite: t.fecha_limite?.split('T')[0] ?? '' })
    setEditId(t.id); setShowForm(true)
  }

  const isVencida = (t: Tarea) => !t.completada && t.fecha_limite && new Date(t.fecha_limite) < new Date()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Tareas"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}>Nueva tarea</Button>}
      />
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:flex-none" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <Search size={14} style={{ color: '#6b7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea…"
            className="bg-transparent text-sm outline-none flex-1 sm:w-44" style={{ color: '#e8ecf7' }} />
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
          {(['pendientes', 'todas', 'completadas'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-2 text-xs font-medium capitalize transition-colors"
              style={{ background: filtro === f ? '#0094ff' : 'transparent', color: filtro === f ? '#fff' : '#6b7280' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: '#6b7280' }}>🎉 Sin tareas {filtro === 'pendientes' ? 'pendientes' : ''}</p>
        ) : (
          <div className="space-y-2 w-full max-w-2xl">
            {filtered.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-4 rounded-xl transition-colors"
                style={{ background: '#111', border: `1px solid ${isVencida(t) ? '#ff006b33' : '#1e1e1e'}` }}>
                <button onClick={() => toggle(t)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{ borderColor: t.completada ? '#10b981' : '#333', background: t.completada ? '#10b981' : 'transparent' }}>
                  {t.completada && <Check size={11} color="#fff" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{TIPO_ICON[t.tipo]}</span>
                    <p className="text-sm font-medium" style={{ color: t.completada ? '#6b7280' : '#e8ecf7', textDecoration: t.completada ? 'line-through' : 'none' }}>
                      {t.titulo}
                    </p>
                    {isVencida(t) && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#ff006b22', color: '#ff006b' }}>Vencida</span>}
                  </div>
                  {t.descripcion && <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{t.descripcion}</p>}
                  {t.fecha_limite && (
                    <p className="text-xs mt-1" style={{ color: isVencida(t) ? '#ff006b' : '#6b7280' }}>
                      {formatDate(t.fecha_limite)}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>Editar</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} title={editId ? 'Editar tarea' : 'Nueva tarea'} onClose={() => setShowForm(false)} maxWidth={440}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Título *</label>
            <input value={form.titulo} onChange={e => f('titulo', e.target.value)} placeholder="¿Qué hay que hacer?"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Tipo</label>
              <select value={form.tipo} onChange={e => f('tipo', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Fecha límite</label>
              <input type="date" value={form.fecha_limite} onChange={e => f('fecha_limite', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => f('descripcion', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save} loading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
