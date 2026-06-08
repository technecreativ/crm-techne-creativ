import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
}

export default function Modal({ open, title, onClose, children, maxWidth = 520 }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full rounded-2xl overflow-hidden"
            style={{ maxWidth, background: '#111111', border: '1px solid #1e1e1e', boxShadow: '0 24px 64px rgba(0,0,0,0.8)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0"
              style={{ borderBottom: '1px solid #1a1a1a' }}>
              <h3 className="text-base font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: '#e8ecf7' }}>
                {title}
              </h3>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#6b7280', background: '#1a1a1a' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ff006b20'; e.currentTarget.style.color = '#ff006b' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#6b7280' }}>
                <X size={15} />
              </button>
            </div>
            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
