import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function Rutas() {
  const { usuario } = useAuth()
  return usuario ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  )
}