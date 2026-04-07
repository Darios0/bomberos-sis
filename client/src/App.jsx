import { useEffect, useState } from 'react'
import api from './api/axios'

function App() {
  const [estado, setEstado] = useState('Verificando conexión...')
  const [color, setColor]   = useState('gray')

  useEffect(() => {
    api.get('/health')
      .then(() => {
        setEstado('✓ Servidor conectado correctamente')
        setColor('green')
      })
      .catch(() => {
        setEstado('✗ No se pudo conectar al servidor')
        setColor('red')
      })
  }, [])

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h2>Sistema de Gestión — Bomberos</h2>
      <p style={{ color, fontWeight: 'bold', fontSize: 18 }}>{estado}</p>
    </div>
  )
}

export default App