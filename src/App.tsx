import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prospectos from './pages/Prospectos'
import ProspectoDetalle from './pages/ProspectoDetalle'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import Tareas from './pages/Tareas'
import Propuestas from './pages/Propuestas'
import PropuestaDetalle from './pages/PropuestaDetalle'
import Proyectos from './pages/Proyectos'
import ProyectoDetalle from './pages/ProyectoDetalle'
import Reportes from './pages/Reportes'
import Perfil from './pages/Perfil'

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/prospectos" element={<Prospectos />} />
          <Route path="/prospectos/:id" element={<ProspectoDetalle />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/propuestas" element={<Propuestas />} />
          <Route path="/propuestas/nueva" element={<PropuestaDetalle />} />
          <Route path="/propuestas/:id" element={<PropuestaDetalle />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
