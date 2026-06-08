import { Menu } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

interface HeaderProps {
  title: string
  actions?: React.ReactNode
}

export default function Header({ title, actions }: HeaderProps) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 gap-3"
      style={{ borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggleSidebar}
          className="p-2 rounded-lg transition-colors lg:hidden flex-shrink-0"
          style={{ color: '#6b7280' }}>
          <Menu size={20} />
        </button>
        <h1 className="text-base sm:text-xl font-bold truncate" style={{ fontFamily: 'Syne, sans-serif', color: '#e8ecf7' }}>
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  )
}
