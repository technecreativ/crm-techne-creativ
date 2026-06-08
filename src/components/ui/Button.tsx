import { motion } from 'motion/react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const STYLES: Record<Variant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary:   { bg: '#0094ff', color: '#fff', border: 'transparent', hoverBg: '#0080e0' },
  secondary: { bg: '#161616', color: '#e8ecf7', border: '#2a2a2a', hoverBg: '#1e1e1e' },
  ghost:     { bg: 'transparent', color: '#9ca3af', border: '#1e1e1e', hoverBg: '#111' },
  danger:    { bg: 'rgba(255,0,107,0.1)', color: '#ff006b', border: 'rgba(255,0,107,0.2)', hoverBg: 'rgba(255,0,107,0.2)' },
}

export default function Button({
  variant = 'secondary', size = 'md', loading, icon, children, disabled, style, ...props
}: ButtonProps) {
  const s = STYLES[variant]
  const pad = size === 'sm' ? '6px 14px' : '8px 18px'
  const fontSize = size === 'sm' ? 12 : 13

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 10, padding: pad,
        fontSize, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'background .15s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={e => !disabled && !loading && (e.currentTarget.style.background = s.hoverBg)}
      onMouseLeave={e => !disabled && !loading && (e.currentTarget.style.background = s.bg)}
      {...(props as object)}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {!loading && icon}
      {children}
    </motion.button>
  )
}
