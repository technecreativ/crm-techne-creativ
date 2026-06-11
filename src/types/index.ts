export type ProspectoStage =
  | 'Nuevo'
  | 'Contactado'
  | 'Reunión'
  | 'Propuesta enviada'
  | 'Ganado'
  | 'Perdido'

export interface Prospecto {
  id: string
  nombre_negocio: string
  contacto: string | null
  ciudad: string | null
  nicho: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  score: number
  stage: ProspectoStage
  problemas_detectados: string | null
  notas: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export type ClienteEstado =
  | 'Kickoff'
  | 'En producción'
  | 'Revisión'
  | 'Entregado'
  | 'Pausado'

export interface Cliente {
  id: string
  prospecto_id: string | null
  nombre_negocio: string
  contacto: string | null
  ciudad: string | null
  whatsapp: string | null
  email: string | null
  servicio: string | null
  estado: ClienteEstado
  drive_folder_url: string | null
  notas: string | null
  created_at: string
}

export type Moneda = 'CLP' | 'USD' | 'VES'

export type ProyectoEstado =
  | 'Briefing'
  | 'En diseño'
  | 'En desarrollo'
  | 'Revisión'
  | 'Entregado'
  | 'Pausado'
  | 'Cancelado'

export type ProyectoTipo =
  | 'Landing page'
  | 'E-commerce'
  | 'Branding'
  | 'Community Manager'
  | 'Auditoría SEO'
  | 'Modificación de productos'
  | 'Otro'

export interface Fase {
  nombre: string
  completada: boolean
}

export interface Proyecto {
  id: string
  cliente_id: string
  cliente_nombre?: string | null
  nombre: string
  tipo: ProyectoTipo | null
  descripcion: string | null
  estado: ProyectoEstado
  fecha_inicio: string | null
  fecha_entrega: string | null
  monto_total: number | null
  moneda: Moneda
  monto_cobrado: number
  fases: Fase[]
  notas: string | null
  created_at: string
}

export type TareaTipo = 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Tarea'

export interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  tipo: TareaTipo
  prospecto_id: string | null
  cliente_id: string | null
  fecha_limite: string | null
  completada: boolean
  assigned_to: string | null
  created_at: string
}

export type PropuestaEstado = 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada'

export interface ServicioPropuesta {
  nombre: string
  descripcion: string
  precio: number
}

export interface Propuesta {
  id: string
  titulo: string
  prospecto_id: string | null
  cliente_id: string | null
  servicios: ServicioPropuesta[]
  monto_total: number | null
  moneda: Moneda
  estado: PropuestaEstado
  drive_url: string | null
  notas: string | null
  created_at: string
  sent_at: string | null
}

export interface Profile {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  created_at: string
}

export type AdicionalEstado = 'Pendiente' | 'Cotizado' | 'Aprobado' | 'En proceso' | 'Completado' | 'Rechazado'

export interface Adicional {
  id: string
  cliente_id: string
  titulo: string
  descripcion: string | null
  estado: AdicionalEstado
  monto: number | null
  moneda: Moneda
  created_at: string
}
