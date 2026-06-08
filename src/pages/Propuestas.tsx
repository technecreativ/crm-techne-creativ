import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import Badge, { STAGE_VARIANT } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { formatDate, formatCurrency } from '../lib/utils'
import type { Propuesta } from '../types'

const ESTADOS = ['Borrador', 'Enviada', 'Aceptada', 'Rechazada']

export default function Propuestas() {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('propuestas').select('*').order('created_at', { ascending: false })
      setPropuestas(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = propuestas.filter(p =>
    (!search || p.titulo.toLowerCase().includes(search.toLowerCase())) &&
    (!filtroEstado || p.estado === filtroEstado)
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Propuestas"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => navigate('/propuestas/nueva')}>Nueva propuesta</Button>}
      />
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:flex-none" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <Search size={14} style={{ color: '#6b7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar propuesta…"
            className="bg-transparent text-sm outline-none flex-1 sm:w-44" style={{ color: '#e8ecf7' }} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#111', border: '1px solid #1e1e1e', color: '#e8ecf7' }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: '#6b7280' }}>Sin propuestas</p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr style={{ background: '#111', borderBottom: '1px solid #1e1e1e' }}>
                  {['Título', 'Monto', 'Moneda', 'Estado', 'Creada', 'Enviada', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => navigate(`/propuestas/${p.id}`)}
                    className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid #111' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#111')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#e8ecf7' }}>{p.titulo}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#10b981' }}>
                      {p.monto_total ? formatCurrency(p.monto_total, p.moneda) : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#9ca3af' }}>{p.moneda}</td>
                    <td className="px-4 py-3"><Badge label={p.estado} variant={STAGE_VARIANT[p.estado]} /></td>
                    <td className="px-4 py-3" style={{ color: '#6b7280' }}>{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3" style={{ color: '#6b7280' }}>{p.sent_at ? formatDate(p.sent_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); navigate(`/propuestas/${p.id}`) }}>Ver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
