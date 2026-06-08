import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Users, UserCheck, CheckSquare, FileText,
  TrendingUp, AlertCircle, ArrowRight, FolderKanban, Clock,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Badge, { STAGE_VARIANT } from '../components/ui/Badge'
import { formatDate } from '../lib/utils'
import type { Prospecto, Tarea, Proyecto } from '../types'

interface Stats {
  prospectos: number
  clientes: number
  tareasActivas: number
  propuestas: number
  proyectos: number
}

const TIPO_COLOR: Record<string, string> = {
  'Landing page': '#0094ff', 'E-commerce': '#8b5cf6', 'Branding': '#ff006b',
  'Community Manager': '#fffc00', 'Auditoría SEO': '#10b981',
  'Modificación de productos': '#00f7ff', 'Otro': '#6b7280',
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ prospectos: 0, clientes: 0, tareasActivas: 0, propuestas: 0, proyectos: 0 })
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [proyectos, setProyectos] = useState<(Proyecto & { cliente_nombre?: string })[]>([])
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const username = user?.username ?? user?.full_name ?? 'Usuario'

  useEffect(() => {
    const load = async () => {
      const [
        { count: p }, { count: c }, { count: t },
        { count: prop }, { count: proy },
      ] = await Promise.all([
        supabase.from('prospectos').select('*', { count: 'exact', head: true }).not('stage', 'in', '("Ganado","Perdido")'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('tareas').select('*', { count: 'exact', head: true }).eq('completada', false),
        supabase.from('propuestas').select('*', { count: 'exact', head: true }).not('estado', 'in', '("Aceptada","Rechazada")'),
        supabase.from('proyectos').select('*', { count: 'exact', head: true }).not('estado', 'in', '("Entregado","Cancelado")'),
      ])
      setStats({ prospectos: p ?? 0, clientes: c ?? 0, tareasActivas: t ?? 0, propuestas: prop ?? 0, proyectos: proy ?? 0 })

      const [{ data: pros }, { data: tars }, { data: proys }] = await Promise.all([
        supabase.from('prospectos').select('*').not('stage', 'in', '("Ganado","Perdido")').order('score', { ascending: false }).limit(5),
        supabase.from('tareas').select('*').eq('completada', false).order('fecha_limite', { ascending: true, nullsFirst: false }).limit(5),
        supabase.from('proyectos').select('*, clientes(nombre_negocio)').not('estado', 'in', '("Entregado","Cancelado")').order('created_at', { ascending: false }).limit(4),
      ])
      setProspectos(pros ?? [])
      setTareas(tars ?? [])
      setProyectos((proys ?? []).map((p: any) => ({ ...p, fases: p.fases ?? [], cliente_nombre: p.clientes?.nombre_negocio ?? null })))
    }
    load()
  }, [])

  const isVencida = (fecha: string | null) => fecha ? new Date(fecha) < new Date() : false

  const KPIS = [
    { label: 'Prospectos', sub: 'en pipeline', value: stats.prospectos, icon: Users, color: '#0094ff', path: '/prospectos' },
    { label: 'Clientes', sub: 'activos', value: stats.clientes, icon: UserCheck, color: '#00f7ff', path: '/clientes' },
    { label: 'Proyectos', sub: 'en curso', value: stats.proyectos, icon: FolderKanban, color: '#8b5cf6', path: '/proyectos' },
    { label: 'Tareas', sub: 'pendientes', value: stats.tareasActivas, icon: CheckSquare, color: '#fffc00', path: '/tareas' },
    { label: 'Propuestas', sub: 'activas', value: stats.propuestas, icon: FileText, color: '#ff006b', path: '/propuestas' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10">

          {/* Saludo */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>
              {saludo}, <span style={{ color: '#0094ff' }}>{username}</span> 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg, #2a2a2a, transparent)' }} />
          </motion.div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {KPIS.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(k.path)}
                className="rounded-2xl p-5 cursor-pointer group relative overflow-hidden flex flex-col items-center text-center"
                style={{ background: '#181818', border: '1px solid #2a2a2a', minHeight: 148 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}>
                {/* glow top bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${k.color}, transparent)` }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${k.color}18` }}>
                  <k.icon size={18} style={{ color: k.color }} />
                </div>
                <div className="mt-auto pt-3 w-full">
                  <p className="text-3xl font-bold leading-none" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>
                    {k.value}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: '#e8ecf7' }}>{k.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{k.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Fila principal: Prospectos + Tareas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Prospectos activos */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl overflow-hidden" style={{ background: '#181818', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0094ff18' }}>
                    <TrendingUp size={14} style={{ color: '#0094ff' }} />
                  </div>
                  <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Prospectos activos</h3>
                </div>
                <button onClick={() => navigate('/prospectos')}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#0094ff', background: '#0094ff11' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0094ff22')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0094ff11')}>
                  Ver todos <ArrowRight size={11} />
                </button>
              </div>
              <div className="p-4">
                {prospectos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Users size={28} style={{ color: '#1e1e1e' }} />
                    <p className="text-sm" style={{ color: '#444' }}>Sin prospectos activos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prospectos.map(p => (
                      <div key={p.id} onClick={() => navigate(`/prospectos/${p.id}`)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all group"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#0d0d0d')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: p.score >= 90 ? '#ff006b22' : '#0094ff18', color: p.score >= 90 ? '#ff006b' : '#0094ff' }}>
                          {p.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#e8ecf7' }}>{p.nombre_negocio}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#6b7280' }}>
                            {[p.ciudad, p.nicho].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <Badge label={p.stage} variant={STAGE_VARIANT[p.stage]} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tareas pendientes */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl overflow-hidden" style={{ background: '#181818', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#fffc0018' }}>
                    <AlertCircle size={14} style={{ color: '#fffc00' }} />
                  </div>
                  <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Tareas pendientes</h3>
                </div>
                <button onClick={() => navigate('/tareas')}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#0094ff', background: '#0094ff11' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0094ff22')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0094ff11')}>
                  Ver todas <ArrowRight size={11} />
                </button>
              </div>
              <div className="p-4">
                {tareas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <CheckSquare size={28} style={{ color: '#1e1e1e' }} />
                    <p className="text-sm" style={{ color: '#444' }}>🎉 Todo al día</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tareas.map(t => {
                      const vencida = isVencida(t.fecha_limite)
                      return (
                        <div key={t.id} onClick={() => navigate('/tareas')}
                          className="flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all"
                          style={{ background: vencida ? '#ff006b08' : 'transparent', border: vencida ? '1px solid #ff006b22' : '1px solid transparent' }}
                          onMouseEnter={e => { if (!vencida) e.currentTarget.style.background = '#0d0d0d' }}
                          onMouseLeave={e => { if (!vencida) e.currentTarget.style.background = 'transparent' }}>
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ background: vencida ? '#ff006b' : '#6b7280' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#e8ecf7' }}>{t.titulo}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock size={10} style={{ color: vencida ? '#ff006b' : '#6b7280' }} />
                              <p className="text-xs" style={{ color: vencida ? '#ff006b' : '#6b7280' }}>
                                {t.fecha_limite ? formatDate(t.fecha_limite) : 'Sin fecha'}
                                {vencida && ' · Vencida'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Proyectos en curso */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl overflow-hidden" style={{ background: '#181818', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#8b5cf618' }}>
                  <FolderKanban size={14} style={{ color: '#8b5cf6' }} />
                </div>
                <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Proyectos en curso</h3>
              </div>
              <button onClick={() => navigate('/proyectos')}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#0094ff', background: '#0094ff11' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0094ff22')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0094ff11')}>
                Ver todos <ArrowRight size={11} />
              </button>
            </div>
            <div className="p-4">
              {proyectos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <FolderKanban size={28} style={{ color: '#1e1e1e' }} />
                  <p className="text-sm" style={{ color: '#444' }}>Sin proyectos activos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {proyectos.map(p => {
                    const fasesOk = p.fases.filter(f => f.completada).length
                    const fasesTotal = p.fases.length
                    const pct = fasesTotal ? Math.round((fasesOk / fasesTotal) * 100) : 0
                    const tipoColor = TIPO_COLOR[p.tipo ?? 'Otro'] ?? '#6b7280'
                    return (
                      <div key={p.id} onClick={() => navigate(`/proyectos/${p.id}`)}
                        className="p-4 rounded-xl cursor-pointer transition-all group"
                        style={{ background: '#111', border: '1px solid #222', borderTop: `2px solid ${tipoColor}` }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = tipoColor + '66')}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#1a1a1a'
                          e.currentTarget.style.borderTopColor = tipoColor
                        }}>
                        <p className="text-sm font-semibold truncate mb-1" style={{ color: '#e8ecf7' }}>{p.nombre}</p>
                        {p.cliente_nombre && (
                          <p className="text-xs mb-2 truncate" style={{ color: '#6b7280' }}>👤 {p.cliente_nombre}</p>
                        )}
                        {p.tipo && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: tipoColor + '18', color: tipoColor }}>
                            {p.tipo}
                          </span>
                        )}
                        {fasesTotal > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1" style={{ color: '#6b7280' }}>
                              <span>Fases</span><span>{fasesOk}/{fasesTotal}</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : tipoColor }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
