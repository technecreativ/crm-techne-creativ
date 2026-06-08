interface BadgeProps {
  label: string
  variant?: 'default' | 'green' | 'blue' | 'yellow' | 'red' | 'cyan' | 'gray'
}

const VARIANTS: Record<string, { bg: string; color: string }> = {
  default: { bg: 'rgba(0,148,255,0.12)', color: '#0094ff' },
  green:   { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  blue:    { bg: 'rgba(0,148,255,0.12)', color: '#0094ff' },
  yellow:  { bg: 'rgba(255,252,0,0.12)', color: '#fffc00' },
  red:     { bg: 'rgba(255,0,107,0.12)', color: '#ff006b' },
  cyan:    { bg: 'rgba(0,247,255,0.12)', color: '#00f7ff' },
  gray:    { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
}

export const STAGE_VARIANT: Record<string, BadgeProps['variant']> = {
  'Nuevo': 'gray',
  'Contactado': 'blue',
  'Propuesta enviada': 'yellow',
  'Reunión': 'cyan',
  'Ganado': 'green',
  'Perdido': 'red',
  'Kickoff': 'cyan',
  'En producción': 'blue',
  'Revisión': 'yellow',
  'Entregado': 'green',
  'Pausado': 'gray',
  'Borrador': 'gray',
  'Enviada': 'blue',
  'Aceptada': 'green',
  'Rechazada': 'red',
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const s = VARIANTS[variant] ?? VARIANTS.default
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  )
}
