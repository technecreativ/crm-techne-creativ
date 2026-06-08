import type { Moneda } from '../types'

export function formatCurrency(amount: number | null, moneda: Moneda = 'CLP'): string {
  if (amount === null || amount === undefined) return '—'
  const opts: Intl.NumberFormatOptions = { style: 'currency', maximumFractionDigits: 0 }
  if (moneda === 'CLP') return new Intl.NumberFormat('es-CL', { ...opts, currency: 'CLP' }).format(amount)
  if (moneda === 'USD') return new Intl.NumberFormat('en-US', { ...opts, currency: 'USD', maximumFractionDigits: 2 }).format(amount)
  return `Bs. ${new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 }).format(amount)}`
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function buildWaUrl(phone: string | null, message = ''): string {
  if (!phone) return '#'
  const clean = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${clean}${message ? `?text=${encoded}` : ''}`
}

export function buildGmailUrl(email: string | null, subject = ''): string {
  if (!email) return '#'
  return `https://mail.google.com/mail/?view=cm&to=${email}&su=${encodeURIComponent(subject)}`
}

export function buildCalendarUrl(title: string, date?: string): string {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const t = `&text=${encodeURIComponent(title)}`
  const d = date ? `&dates=${date.replace(/-/g, '')}/${date.replace(/-/g, '')}` : ''
  return `${base}${t}${d}`
}

export function scoreColor(score: number): string {
  if (score >= 95) return '#ff006b'
  if (score >= 90) return '#fffc00'
  return '#0094ff'
}

export function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
