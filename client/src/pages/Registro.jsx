import { useState } from 'react'
import api from '../api/axios'
import {
  Box, Card, CardContent, TextField,
  Button, Typography, Alert
} from '@mui/material'

export default function Registro({ onVolver }) {
  const [form, setForm] = useState({
    nombre: '', email: '', cedula: '', password: '', confirmar: ''
  })
  const [error, setError]     = useState('')
  const [exito, setExito]     = useState(null)
  const [cargando, setCargando] = useState(false)

  const validarCedula = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) return false
    // Algoritmo de validación de cédula ecuatoriana
    const digitos    = cedula.split('').map(Number)
    const provincia  = parseInt(cedula.substring(0, 2))
    if (provincia < 1 || provincia > 24) return false
    const verificador = digitos[9]
    const impares = [0, 2, 4, 6, 8].reduce((sum, i) => {
      let val = digitos[i] * 2
      if (val > 9) val -= 9
      return sum + val
    }, 0)
    const pares = [1, 3, 5, 7].reduce((sum, i) => sum + digitos[i], 0)
    const total  = impares + pares
    const check  = total % 10 === 0 ? 0 : 10 - (total % 10)
    return check === verificador
  }

  const registrar = async () => {
    setError('')

    if (!form.nombre || !form.email || !form.cedula || !form.password || !form.confirmar) {
      setError('Todos los campos son requeridos')
      return
    }
    if (!form.email.endsWith('@bomberosibarra.gob.ec')) {
      setError('Solo se permiten correos institucionales (@bomberosibarra.gob.ec)')
      return
    }
    if (!validarCedula(form.cedula)) {
      setError('La cédula ingresada no es válida')
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
      const res = await api.post('/usuarios/registro', {
        nombre:   form.nombre,
        email:    form.email,
        cedula:   form.cedula,
        password: form.password
      })
      setExito(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setCargando(false)
    }
  }

  return (
  <Box sx={{
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  bgcolor: '#f5f5f5',
  py: 3,
  px: 2
}}>
  <Card sx={{ width: '100%', maxWidth: 440, p: 1 }}>
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
                <Typography variant="body2" fontWeight="bold" mb={0.5}>
                  Solicitud enviada correctamente
                </Typography>
                <Typography variant="caption" display="block">
                  Empleado verificado: <strong>{exito.empleado?.nombre}</strong> — {exito.empleado?.rango}
                </Typography>
                <Typography variant="caption" display="block" mt={0.5}>
                  Tu cuenta está pendiente de aprobación. El administrador revisará tu solicitud.
                </Typography>
              </Alert>
              <Button fullWidth variant="outlined" color="error" onClick={onVolver}>
                Volver al inicio de sesión
              </Button>
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  Solo correos <strong>@bomberosibarra.gob.ec</strong> — Tu cédula debe coincidir con el registro de personal
                </Typography>
              </Alert>

              <TextField
                label="Nombre completo" fullWidth margin="normal"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
              <TextField
                label="Número de cédula" fullWidth margin="normal"
                placeholder="10 dígitos sin guiones"
                inputProps={{ maxLength: 10 }}
                value={form.cedula}
                onChange={e => setForm({ ...form, cedula: e.target.value.replace(/\D/g, '') })}
                helperText="Debe coincidir con tu cédula en el registro de personal"
                error={form.cedula.length > 0 && form.cedula.length < 10}
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
                onClick={registrar}
                disabled={cargando}
              >
                {cargando ? 'Verificando...' : 'Solicitar acceso'}
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