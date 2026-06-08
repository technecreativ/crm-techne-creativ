import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, FolderKanban, FileText } from 'lucide-react'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import Header from '../components/layout/Header'
import { formatCurrency } from '../lib/utils'

interface PipelineRow { stage: string; count: number }
interface ProyectoEstadoRow { estado: string; count: number }
interface PropuestaEstadoRow { estado: string; count: number }
interface IngresoRow { moneda: string; total: number; cobrado: number }

const STAGE_ORDER = ['Nuevo', 'Contactado', 'Propuesta enviada', 'Reunión', 'Ganado', 'Perdido']
const STAGE_COLOR: Record<string, string> = {
  'Nuevo': '#6b7280', 'Contactado': '#0094ff', 'Propuesta enviada': '#8b5cf6',
  'Reunión': '#00f7ff', 'Ganado': '#10b981', 'Perdido': '#ff006b',
}
const ESTADO_COLOR: Record<string, string> = {
  'Briefing': '#6b7280', 'En diseño': '#0094ff', 'En desarrollo': '#8b5cf6',
  'Revisión': '#fffc00', 'Entregado': '#10b981', 'Pausado': '#f97316', 'Cancelado': '#ff006b',
}
const PROP_COLOR: Record<string, string> = {
  'Borrador': '#6b7280', 'Enviada': '#0094ff', 'Aceptada': '#10b981', 'Rechazada': '#ff006b',
}

export default function Reportes() {
  const [pipeline, setPipeline] = useState<PipelineRow[]>([])
  const [proyEstados, setProyEstados] = useState<ProyectoEstadoRow[]>([])
  const [propEstados, setPropEstados] = useState<PropuestaEstadoRow[]>([])
  const [ingresos, setIngresos] = useState<IngresoRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: pros }, { data: proys }, { data: props }, { data: ingData }] = await Promise.all([
        supabase.from('prospectos').select('stage'),
        supabase.from('proyectos').select('estado'),
        supabase.from('propuestas').select('estado'),
        supabase.from('proyectos').select('moneda, monto_total, monto_cobrado').not('monto_total', 'is', null),
      ])

      // Pipeline
      const pipeMap: Record<string, number> = {}
      ;(pros ?? []).forEach((p: any) => { pipeMap[p.stage] = (pipeMap[p.stage] ?? 0) + 1 })
      setPipeline(STAGE_ORDER.map(s => ({ stage: s, count: pipeMap[s] ?? 0 })))

      // Proyectos por estado
      const estMap: Record<string, number> = {}
      ;(proys ?? []).forEach((p: any) => { estMap[p.estado] = (estMap[p.estado] ?? 0) + 1 })
      setProyEstados(Object.entries(estMap).map(([estado, count]) => ({ estado, count })).sort((a, b) => b.count - a.count))

      // Propuestas por estado
      const propMap: Record<string, number> = {}
      ;(props ?? []).forEach((p: any) => { propMap[p.estado] = (propMap[p.estado] ?? 0) + 1 })
      setPropEstados(['Borrador', 'Enviada', 'Aceptada', 'Rechazada'].map(s => ({ estado: s, count: propMap[s] ?? 0 })))

      // Ingresos por moneda
      const ingMap: Record<string, { total: number; cobrado: number }> = {}
      ;(ingData ?? []).forEach((p: any) => {
        if (!ingMap[p.moneda]) ingMap[p.moneda] = { total: 0, cobrado: 0 }
        ingMap[p.moneda].total += Number(p.monto_total ?? 0)
        ingMap[p.moneda].cobrado += Number(p.monto_cobrado ?? 0)
      })
      setIngresos(Object.entries(ingMap).map(([moneda, v]) => ({ moneda, ...v })))

      setLoading(false)
    }
    load()
  }, [])

  const totalProspectos = pipeline.reduce((a, p) => a + p.count, 0)
  const ganados = pipeline.find(p => p.stage === 'Ganado')?.count ?? 0
  const tasaConversion = totalProspectos ? Math.round((ganados / totalProspectos) * 100) : 0

  const totalPropuestas = propEstados.reduce((a, p) => a + p.count, 0)
  const aceptadas = propEstados.find(p => p.estado === 'Aceptada')?.count ?? 0
  const tasaCierre = totalPropuestas ? Math.round((aceptadas / totalPropuestas) * 100) : 0

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0094ff]/30 border-t-[#0094ff] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Reportes" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* KPIs resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total prospectos', value: totalProspectos, color: '#0094ff', icon: TrendingUp },
              { label: 'Tasa de conversión', value: `${tasaConversion}%`, color: '#10b981', icon: TrendingUp },
              { label: 'Propuestas totales', value: totalPropuestas, color: '#8b5cf6', icon: FileText },
              { label: 'Tasa de cierre', value: `${tasaCierre}%`, color: '#fffc00', icon: FileText },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${k.color}, transparent)` }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}18` }}>
                  <k.icon size={18} style={{ color: k.color }} />
                </div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{k.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: '#6b7280' }}>{k.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline de prospectos */}
            <Section icon={<TrendingUp size={15} style={{ color: '#0094ff' }} />} title="Pipeline de prospectos" accent="#0094ff">
              <div className="space-y-3">
                {pipeline.map(({ stage, count }) => {
                  const pct = totalProspectos ? Math.round((count / totalProspectos) * 100) : 0
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLOR[stage] ?? '#6b7280' }} />
                          <span style={{ color: '#9ca3af' }}>{stage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: '#e8ecf7' }}>{count}</span>
                          <span style={{ color: '#444' }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded-full" style={{ background: STAGE_COLOR[stage] ?? '#6b7280', minWidth: count > 0 ? 4 : 0 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* Propuestas enviadas vs aceptadas */}
            <Section icon={<FileText size={15} style={{ color: '#8b5cf6' }} />} title="Estado de propuestas" accent="#8b5cf6">
              <div className="space-y-3">
                {propEstados.map(({ estado, count }) => {
                  const pct = totalPropuestas ? Math.round((count / totalPropuestas) * 100) : 0
                  return (
                    <div key={estado}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: PROP_COLOR[estado] ?? '#6b7280' }} />
                          <span style={{ color: '#9ca3af' }}>{estado}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: '#e8ecf7' }}>{count}</span>
                          <span style={{ color: '#444' }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded-full" style={{ background: PROP_COLOR[estado] ?? '#6b7280', minWidth: count > 0 ? 4 : 0 }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 mt-1" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#6b7280' }}>Tasa de cierre</span>
                    <span className="font-bold" style={{ color: tasaCierre >= 50 ? '#10b981' : '#fffc00' }}>{tasaCierre}%</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Proyectos por estado */}
            <Section icon={<FolderKanban size={15} style={{ color: '#8b5cf6' }} />} title="Proyectos por etapa" accent="#8b5cf6">
              {proyEstados.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#444' }}>Sin proyectos registrados</p>
              ) : (
                <div className="space-y-3">
                  {proyEstados.map(({ estado, count }) => {
                    const max = Math.max(...proyEstados.map(e => e.count))
                    const pct = max ? Math.round((count / max) * 100) : 0
                    return (
                      <div key={estado}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: ESTADO_COLOR[estado] ?? '#6b7280' }} />
                            <span style={{ color: '#9ca3af' }}>{estado}</span>
                          </div>
                          <span className="font-semibold" style={{ color: '#e8ecf7' }}>{count}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                            className="h-full rounded-full" style={{ background: ESTADO_COLOR[estado] ?? '#6b7280', minWidth: 4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            {/* Ingresos */}
            <Section icon={<DollarSign size={15} style={{ color: '#10b981' }} />} title="Ingresos cobrados vs pendientes" accent="#10b981">
              {ingresos.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#444' }}>Sin proyectos con monto registrado</p>
              ) : (
                <div className="space-y-6">
                  {ingresos.map(({ moneda, total, cobrado }) => {
                    const pendiente = total - cobrado
                    const pct = total ? Math.round((cobrado / total) * 100) : 0
                    return (
                      <div key={moneda}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#10b98122', color: '#10b981' }}>{moneda}</span>
                          <span className="text-xs" style={{ color: '#6b7280' }}>{pct}% cobrado</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: '#6b7280' }}>Total facturado</span>
                            <span style={{ color: '#e8ecf7' }}>{formatCurrency(total, moneda as any)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: '#6b7280' }}>Cobrado</span>
                            <span style={{ color: '#10b981' }}>{formatCurrency(cobrado, moneda as any)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: '#6b7280' }}>Pendiente de cobro</span>
                            <span style={{ color: pendiente > 0 ? '#fffc00' : '#10b981' }}>{formatCurrency(pendiente, moneda as any)}</span>
                          </div>
                        </div>
                        <div className="mt-3 h-3 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #10b981, #00f7ff)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </div>

        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
      <div className="flex items-center gap-2 px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
          {icon}
        </div>
        <h3 className="font-semibold text-sm" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  )
}
