import { useState } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, Lock, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import { initials } from '../lib/utils'

export default function Perfil() {
  const { user } = useAuthStore()
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setError(null)
    setSuccess(false)
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (newPass !== confirmPass) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)
    if (err) { setError('No se pudo actualizar la contraseña. Intentá de nuevo.'); return }
    setSuccess(true)
    setNewPass('')
    setConfirmPass('')
    setTimeout(() => setSuccess(false), 4000)
  }

  const inp = {
    background: '#0a0a0a', border: '1.5px solid #1e1e1e',
    color: '#e8ecf7', width: '100%', padding: '12px 48px 12px 16px',
    borderRadius: 12, fontSize: 14, outline: 'none',
  }

  const username = user?.username ?? (user?.email ?? '').split('@')[0]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Mi perfil" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-5">

          {/* Avatar + nombre */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 flex items-center gap-5"
            style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0094ff, #00f7ff)', color: '#0a0a0a' }}>
              {initials(username)}
            </div>
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>{username}</p>
              <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Administrador · Techne Creativ</p>
            </div>
          </motion.div>

          {/* Cambiar contraseña */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <div className="flex items-center gap-2 mb-5" style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0094ff18' }}>
                <Lock size={14} style={{ color: '#0094ff' }} />
              </div>
              <h3 className="font-semibold" style={{ fontFamily: 'Syne', color: '#e8ecf7' }}>Cambiar contraseña</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#6b7280' }}>Nueva contraseña</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres" style={inp}
                    onFocus={e => (e.target.style.borderColor = '#0094ff')}
                    onBlur={e => (e.target.style.borderColor = '#1e1e1e')} />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#6b7280' }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#6b7280' }}>Confirmar contraseña</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Repetir contraseña" style={inp}
                    onFocus={e => (e.target.style.borderColor = '#0094ff')}
                    onBlur={e => (e.target.style.borderColor = '#1e1e1e')} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#6b7280' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#ff006b12', color: '#ff006b', border: '1px solid #ff006b33' }}>
                  {error}
                </p>
              )}

              {success && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  style={{ background: '#10b98112', color: '#10b981', border: '1px solid #10b98133' }}>
                  <Check size={14} /> Contraseña actualizada correctamente
                </motion.div>
              )}

              <div className="flex justify-end pt-1">
                <Button variant="primary" onClick={save} loading={loading} icon={<Lock size={13} />}>
                  Actualizar contraseña
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
