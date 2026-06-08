import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard, Users, UserCheck, CheckSquare,
  FileText, LogOut, X, ChevronRight, FolderKanban,
  BarChart2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { initials } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import logoUrl from '../../assets/logo-techne.png'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null as null | number },
  { to: '/prospectos', icon: Users, label: 'Prospectos', badge: null as null | number },
  { to: '/clientes', icon: UserCheck, label: 'Clientes', badge: null as null | number },
  { to: '/proyectos', icon: FolderKanban, label: 'Proyectos', badge: null as null | number },
  { to: '/tareas', icon: CheckSquare, label: 'Tareas', badge: null as null | number },
  { to: '/propuestas', icon: FileText, label: 'Propuestas', badge: null as null | number },
  { to: '/reportes', icon: BarChart2, label: 'Reportes', badge: null as null | number },
]

export default function Sidebar() {
  const { user, signOut } = useAuthStore()
  const { sidebarOpen, setSidebar } = useUIStore()
  const navigate = useNavigate()
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase.from('tareas')
        .select('*', { count: 'exact', head: true })
        .eq('completada', false)
        .lt('fecha_limite', new Date().toISOString())
      setOverdueCount(count ?? 0)
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-40 h-screen flex flex-col lg:translate-x-0"
        style={{ width: 260, background: '#0d0d0d', borderRight: '1px solid #1a1a1a' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid #1a1a1a' }}>
          <img src={logoUrl} alt="Techne Creativ" className="h-8 w-auto" />
          <button onClick={() => setSidebar(false)} className="lg:hidden p-1 rounded" style={{ color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => {
            const isTareas = to === '/tareas'
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => window.innerWidth < 1024 && setSidebar(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${isActive ? 'text-white' : 'hover:bg-white/5'}`
                }
                style={({ isActive }) => isActive
                  ? { background: 'linear-gradient(135deg, #0094ff22, #00f7ff11)', color: '#0094ff', border: '1px solid #0094ff33' }
                  : { color: '#6b7280', border: '1px solid transparent' }
                }
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {isTareas && overdueCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{ background: '#ff006b', color: '#fff', fontSize: 10 }}>
                    {overdueCount}
                  </span>
                )}
                {!isTareas && <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
              </NavLink>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: '#161616' }}>
            <button onClick={() => navigate('/perfil')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ background: 'linear-gradient(135deg, #0094ff, #00f7ff)', color: '#0a0a0a' }}>
              {initials(user?.full_name ?? user?.username ?? null)}
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/perfil')}>
              <p className="text-sm font-semibold truncate" style={{ color: '#e8ecf7' }}>
                {user?.full_name ?? user?.username ?? 'Usuario'}
              </p>
              <p className="text-xs truncate" style={{ color: '#6b7280' }}>Administrador</p>
            </div>
            <button onClick={handleSignOut} title="Cerrar sesión"
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: '#6b7280' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
