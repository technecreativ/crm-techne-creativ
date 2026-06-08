import { Outlet } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import Sidebar from './Sidebar'

export default function Layout() {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0a' }}>
      <Sidebar />
      <main
        className="flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 260 : 0 }}
      >
        <Outlet />
        <footer className="text-center py-3 text-xs mt-auto" style={{ color: '#333', borderTop: '1px solid #111' }}>
          Desarrollado por{' '}
          <a href="https://technecreativ.com" target="_blank" rel="noreferrer" style={{ color: '#0094ff' }}>
            Techne Creativ
          </a>
        </footer>
      </main>
    </div>
  )
}
