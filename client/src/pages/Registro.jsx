import { useState } from 'react'
import api from '../api/axios'
import {
  Box, Card, CardContent, TextField,
  Button, Typography, Alert
} from '@mui/material'

export default function Registro({ onVolver }) {
  const [form, setForm]     = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [error, setError]   = useState('')
  const [exito, setExito]   = useState(false)
  const [cargando, setCargando] = useState(false)

  const registrar = async () => {
    setError('')
    if (!form.nombre || !form.email || !form.password) {
      setError('Todos los campos son requeridos')
      return
    }
    if (!form.email.endsWith('@bomberosibarra.gob.ec')) {
      setError('Solo se permiten correos institucionales (@bomberosibarra.gob.ec)')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setCargando(true)
    try {
      await api.post('/usuarios/registro', {
        nombre:   form.nombre,
        email:    form.email,
        password: form.password
      })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5'
    }}>
      <Card sx={{ width: 420, p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" textAlign="center" mb={0.5}>
            🚒 Bomberos Ibarra
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Solicitar acceso al sistema
          </Typography>

          {exito ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Solicitud enviada correctamente
                </Typography>
                <Typography variant="caption">
                  Tu cuenta está pendiente de aprobación. El administrador revisará tu solicitud y recibirás acceso una vez aprobada.
                </Typography>
              </Alert>
              <Button fullWidth variant="outlined" onClick={onVolver}>
                Volver al inicio de sesión
              </Button>
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  Solo se permiten correos institucionales: <strong>@bomberosibarra.gob.ec</strong>
                </Typography>
              </Alert>

              <TextField
                label="Nombre completo" fullWidth margin="normal"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
              <TextField
                label="Correo institucional" fullWidth margin="normal"
                placeholder="nombre@bomberosibarra.gob.ec"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                label="Contraseña" type="password" fullWidth margin="normal"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <TextField
                label="Confirmar contraseña" type="password" fullWidth margin="normal"
                value={form.confirmar}
                onChange={e => setForm({ ...form, confirmar: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && registrar()}
              />

              <Button
                variant="contained" fullWidth
                sx={{ mt: 2, py: 1.5, bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' } }}
                onClick={registrar} disabled={cargando}
              >
                {cargando ? 'Enviando solicitud...' : 'Solicitar acceso'}
              </Button>

              <Button fullWidth sx={{ mt: 1 }} onClick={onVolver}>
                Ya tengo cuenta — Iniciar sesión
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}