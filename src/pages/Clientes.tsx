import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Badge, { STAGE_VARIANT } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ContactButtons from '../components/shared/ContactButtons'
import type { Cliente, ClienteEstado } from '../types'

const ESTADOS: ClienteEstado[] = ['Kickoff', 'En producción', 'Revisión', 'Entregado', 'Pausado']
const SERVICIOS = ['Landing page', 'E-commerce', 'Branding', 'Community Manager', 'SEO', 'Catálogo WhatsApp', 'Otro']

interface FormData {
  nombre_negocio: string; contacto: string; ciudad: string
  whatsapp: string; email: string; servicio: string
  estado: ClienteEstado; drive_folder_url: string; notas: string
}

const EMPTY: FormData = {
  nombre_negocio: '', contacto: '', ciudad: '', whatsapp: '',
  email: '', servicio: 'Landing page', estado: 'Kickoff', drive_folder_url: '', notas: '',
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    return (!q || c.nombre_negocio.toLowerCase().includes(q)) &&
      (!filtroEstado || c.estado === filtroEstado)
  })

  const f = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.nombre_negocio.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('clientes').update(form).eq('id', editId)
    } else {
      await supabase.from('clientes').insert(form)
    }
    setSaving(false); setShowForm(false); load()
  }

  const openEdit = (c: Cliente) => {
    setForm({ nombre_negocio: c.nombre_negocio, contacto: c.contacto ?? '', ciudad: c.ciudad ?? '',
      whatsapp: c.whatsapp ?? '', email: c.email ?? '', servicio: c.servicio ?? '',
      estado: c.estado, drive_folder_url: c.drive_folder_url ?? '', notas: c.notas ?? '' })
    setEditId(c.id); setShowForm(true)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Clientes"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}>Nuevo cliente</Button>}
      />
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <Search size={14} style={{ color: '#6b7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente…"
            className="bg-transparent text-sm outline-none w-48" style={{ color: '#e8ecf7' }} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none" style={{ background: '#111', border: '1px solid #1e1e1e', color: '#e8ecf7' }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: '#6b7280' }}>Sin clientes</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}
                className="rounded-2xl p-5 cursor-pointer transition-all"
                style={{ background: '#111', border: '1px solid #1e1e1e' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0094ff44')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{c.nombre_negocio}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{c.ciudad}</p>
                  </div>
                  <Badge label={c.estado} variant={STAGE_VARIANT[c.estado]} />
                </div>
                <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>{c.servicio}</p>
                <div className="flex items-center justify-between">
                  <ContactButtons whatsapp={c.whatsapp} email={c.email} driveUrl={c.drive_folder_url} />
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openEdit(c) }}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} title={editId ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <F label="Nombre del negocio *" value={form.nombre_negocio} onChange={v => f('nombre_negocio', v)} />
            <F label="Persona de contacto" value={form.contacto} onChange={v => f('contacto', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Ciudad" value={form.ciudad} onChange={v => f('ciudad', v)} />
            <F label="WhatsApp" value={form.whatsapp} onChange={v => f('whatsapp', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Email" value={form.email} onChange={v => f('email', v)} />
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Servicio</label>
              <select value={form.servicio} onChange={e => f('servicio', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}>
                {SERVICIOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>Estado</label>
              <select value={form.estado} onChange={e => f('estado', e.target.value as ClienteEstado)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }}>
                {ESTADOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <F label="Link carpeta Drive" value={form.drive_folder_url} onChange={v => f('drive_folder_url', v)} placeholder="https://drive.google.com/…" />
          </div>
          <F label="Notas" value={form.notas} onChange={v => f('notas', v)} textarea />
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
            <Button onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save} loading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function F({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  const s = { background: '#0a0a0a', border: '1.5px solid #1e1e1e', color: '#e8ecf7' }
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={s} placeholder={placeholder} />
        : <input value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={s} placeholder={placeholder} />}
    </div>
  )
}
