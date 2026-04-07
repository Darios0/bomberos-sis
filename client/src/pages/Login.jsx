import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  Box, Card, CardContent, TextField,
  Button, Typography, Alert
} from '@mui/material'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setCargando(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.usuario)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f5f5f5'
    }}>
      <Card sx={{ width: 380, p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
            🚒 Bomberos
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Sistema de gestión de turnos
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Correo electrónico"
            fullWidth
            margin="normal"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2, py: 1.5, bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' } }}
            onClick={handleSubmit}
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}