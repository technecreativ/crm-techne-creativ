import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  )

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0a' }}>
      <Sidebar />
      <main
        className="flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300"
        style={{ marginLeft: isDesktop ? 260 : 0 }}
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
