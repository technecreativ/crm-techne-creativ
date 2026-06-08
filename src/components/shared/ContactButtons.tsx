import { MessageCircle, Mail, Folder, Calendar } from 'lucide-react'
import { buildWaUrl, buildGmailUrl, buildCalendarUrl } from '../../lib/utils'

interface ContactButtonsProps {
  whatsapp?: string | null
  email?: string | null
  driveUrl?: string | null
  calendarTitle?: string
  size?: 'sm' | 'md'
}

export default function ContactButtons({
  whatsapp, email, driveUrl, calendarTitle, size = 'sm',
}: ContactButtonsProps) {
  const iconSize = size === 'sm' ? 14 : 16
  const cls = `flex items-center justify-center rounded-lg transition-colors ${
    size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  }`

  return (
    <div className="flex items-center gap-1">
      {whatsapp && (
        <a href={buildWaUrl(whatsapp)} target="_blank" rel="noreferrer" title="WhatsApp"
          className={cls}
          style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,211,102,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(37,211,102,0.1)')}>
          <MessageCircle size={iconSize} />
        </a>
      )}
      {email && (
        <a href={buildGmailUrl(email)} target="_blank" rel="noreferrer" title="Gmail"
          className={cls}
          style={{ background: 'rgba(0,148,255,0.1)', color: '#0094ff' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,148,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,148,255,0.1)')}>
          <Mail size={iconSize} />
        </a>
      )}
      {driveUrl && (
        <a href={driveUrl} target="_blank" rel="noreferrer" title="Google Drive"
          className={cls}
          style={{ background: 'rgba(255,252,0,0.1)', color: '#fffc00' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,252,0,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,252,0,0.1)')}>
          <Folder size={iconSize} />
        </a>
      )}
      {calendarTitle && (
        <a href={buildCalendarUrl(calendarTitle)} target="_blank" rel="noreferrer" title="Google Calendar"
          className={cls}
          style={{ background: 'rgba(0,247,255,0.1)', color: '#00f7ff' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,247,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,247,255,0.1)')}>
          <Calendar size={iconSize} />
        </a>
      )}
    </div>
  )
}
