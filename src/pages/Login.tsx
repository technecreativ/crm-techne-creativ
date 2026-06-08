import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import logoUrl from '../assets/logo-techne.png'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Completa usuario y contraseña.')
      return
    }
    const err = await signIn(username, password)
    if (err) {
      setError('Usuario o contraseña incorrectos.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1a2e 0%, #0a0a0a 60%)' }}>

      {/* Glow decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #0094ff, #00f7ff)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm mx-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4"
            style={{ filter: 'drop-shadow(0 0 24px rgba(0,148,255,0.35))' }}
          >
            <img src={logoUrl} alt="Techne Creativ" className="w-48 h-auto" />
          </motion.div>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Sistema Administrativo · CRM Interno
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8"
          style={{ background: '#111111', borderColor: '#1e1e1e', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

          <h2 className="text-lg font-semibold mb-6" style={{ color: '#e8ecf7', fontFamily: 'Syne, sans-serif' }}>
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#6b7280' }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="jmejiasdaza"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: '#0a0a0a',
                  border: '1.5px solid #1e1e1e',
                  color: '#e8ecf7',
                }}
                onFocus={e => (e.target.style.borderColor = '#0094ff')}
                onBlur={e => (e.target.style.borderColor = '#1e1e1e')}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#6b7280' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#0a0a0a',
                    border: '1.5px solid #1e1e1e',
                    color: '#e8ecf7',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0094ff')}
                  onBlur={e => (e.target.style.borderColor = '#1e1e1e')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#6b7280' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,0,107,0.12)', color: '#ff006b', border: '1px solid rgba(255,0,107,0.25)' }}
              >
                {error}
              </motion.p>
            )}

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all mt-2"
              style={{
                background: loading ? '#1a3a5e' : '#0094ff',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#333' }}>
          Desarrollado por <a href="https://technecreativ.com" target="_blank" rel="noreferrer"
            style={{ color: '#0094ff' }}>Techne Creativ</a>
        </p>
      </motion.div>
    </div>
  )
}
