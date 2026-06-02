import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, TextField, Typography, Alert
} from '@mui/material'

const COLOR_ROL = {
  ADMIN:        { color: '#c62828', label: 'Administrador'  },
  OPERADOR:     { color: '#e65100', label: 'Operador'        },
  EVALUADOR:    { color: '#0288d1', label: 'Evaluador'       },
  VISUALIZADOR: { color: '#555',    label: 'Visualizador'    }
}

const COLOR_GRUPO = {
  GRUPO_1: '#c62828',
  GRUPO_2: '#1565c0',
  GRUPO_3: '#2e7d32'
}

const COLOR_AUSENCIA = {
  VACACIONES: '#f57c00', ENFERMEDAD: '#d32f2f',
  PERMISO: '#0288d1', FALTA: '#7b1fa2', ATRASO: '#455a64'
}

export default function Perfil() {
  const { usuario: usuarioAuth } = useAuth()
  const [datos, setDatos]         = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState('')

  const [formPass, setFormPass] = useState({
    passwordActual: '', passwordNueva: '', confirmar: ''
  })
  const [errorPass, setErrorPass]   = useState('')
  const [cambiando, setCambiando]   = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = async () => {
    try {
      const res = await api.get(`/usuarios/perfil/${usuarioAuth.id}`)
      setDatos(res.data)
    } catch {
      setError('Error al cargar perfil')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const cambiarPassword = async () => {
    setErrorPass('')
    if (!formPass.passwordActual || !formPass.passwordNueva || !formPass.confirmar) {
      setErrorPass('Completa todos los campos')
      return
    }
    if (formPass.passwordNueva !== formPass.confirmar) {
      setErrorPass('Las contraseñas nuevas no coinciden')
      return
    }
    if (formPass.passwordNueva.length < 6) {
      setErrorPass('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCambiando(true)
    try {
      await api.put(`/usuarios/perfil/${usuarioAuth.id}/password`, {
        passwordActual: formPass.passwordActual,
        passwordNueva:  formPass.passwordNueva
      })
      setExito('Contraseña actualizada correctamente')
      setFormPass({ passwordActual: '', passwordNueva: '', confirmar: '' })
      setMostrarForm(false)
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setErrorPass(err.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setCambiando(false)
    }
  }

  if (cargando) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
  if (error)    return <Alert severity="error">{error}</Alert>
  if (!datos)   return null

  const { usuario, empleado } = datos
  const rolInfo = COLOR_ROL[usuario.rol] || COLOR_ROL.VISUALIZADOR
  const iniciales = usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>Mi perfil</Typography>

      {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}

      {/* Tarjeta principal */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ bgcolor: rolInfo.color, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 'bold', color: 'white', flexShrink: 0
          }}>
            {iniciales}
          </Box>
          <Box>
            <Typography variant="h6" color="white" fontWeight="bold">
              {usuario.nombre}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.85)">
              {usuario.email}
            </Typography>
            <Chip
              label={rolInfo.label}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', mt: 0.5, fontSize: 11 }}
            />
          </Box>
        </Box>

        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Cédula</Typography>
              <Typography variant="body2" fontWeight={500}>
                {usuario.cedula || 'No registrada'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Miembro desde</Typography>
              <Typography variant="body2" fontWeight={500}>
                {new Date(usuario.creadoEn).toLocaleDateString('es-EC', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Estado de cuenta</Typography>
              <Box>
                <Chip
                  label={usuario.activo ? 'Activa' : 'Inactiva'}
                  color={usuario.activo ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Info del empleado vinculado */}
      {empleado && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" mb={1.5}>
              Información como empleado
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2, mb: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Rango</Typography>
                <Typography variant="body2" fontWeight={500}>{empleado.rango}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Tipo de personal</Typography>
                <Typography variant="body2" fontWeight={500}>{empleado.tipoPersonal}</Typography>
              </Box>
              {empleado.grupoOperativo && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Grupo</Typography>
                  <Chip
                    label={empleado.grupoOperativo.replace('_',' ')}
                    size="small"
                    sx={{
                      bgcolor: COLOR_GRUPO[empleado.grupoOperativo],
                      color: 'white', fontSize: 11, mt: 0.3
                    }}
                  />
                </Box>
              )}
              {empleado.grupoEcu && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Grupo ECU</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {empleado.grupoEcu.replace('_',' ')}
                  </Typography>
                </Box>
              )}
              {empleado.estacion && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Estación actual</Typography>
                  <Typography variant="body2" fontWeight={500}>{empleado.estacion.nombre}</Typography>
                </Box>
              )}
            </Box>

            {/* Próximas ausencias */}
            {empleado.ausencias?.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                  Próximas ausencias registradas
                </Typography>
                {empleado.ausencias.map(a => (
                  <Box key={a.id} sx={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', py: 0.5, px: 1,
                    bgcolor: '#fafafa', borderRadius: 1, mb: 0.5,
                    border: '1px solid #f0f0f0'
                  }}>
                    <Box>
                      <Chip
                        label={a.tipo} size="small"
                        sx={{
                          bgcolor: COLOR_AUSENCIA[a.tipo], color: 'white',
                          fontSize: 10, height: 18, mr: 1
                        }}
                      />
                      {a.tipoPermiso && (
                        <Typography variant="caption" color="text.secondary">
                          {a.tipoPermiso}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(a.fechaInicio).toLocaleDateString('es-EC')} →{' '}
                      {new Date(a.fechaFin).toLocaleDateString('es-EC')}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cambiar contraseña */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Seguridad
            </Typography>
            <Button
              size="small"
              variant={mostrarForm ? 'outlined' : 'contained'}
              sx={{ bgcolor: mostrarForm ? 'transparent' : '#c62828' }}
              onClick={() => { setMostrarForm(f => !f); setErrorPass('') }}
            >
              {mostrarForm ? 'Cancelar' : 'Cambiar contraseña'}
            </Button>
          </Box>

          {!mostrarForm && (
            <Typography variant="body2" color="text.secondary">
              Por seguridad, cambia tu contraseña regularmente. Usa al menos 6 caracteres.
            </Typography>
          )}

          {mostrarForm && (
            <Box sx={{ mt: 1 }}>
              {errorPass && <Alert severity="error" sx={{ mb: 2 }}>{errorPass}</Alert>}
              <TextField
                label="Contraseña actual" type="password" fullWidth margin="normal" size="small"
                value={formPass.passwordActual}
                onChange={e => setFormPass({ ...formPass, passwordActual: e.target.value })}
              />
              <TextField
                label="Nueva contraseña" type="password" fullWidth margin="normal" size="small"
                value={formPass.passwordNueva}
                onChange={e => setFormPass({ ...formPass, passwordNueva: e.target.value })}
                helperText="Mínimo 6 caracteres"
              />
              <TextField
                label="Confirmar nueva contraseña" type="password" fullWidth margin="normal" size="small"
                value={formPass.confirmar}
                onChange={e => setFormPass({ ...formPass, confirmar: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && cambiarPassword()}
              />
              <Button
                variant="contained" fullWidth
                sx={{ mt: 1, bgcolor: '#c62828' }}
                onClick={cambiarPassword}
                disabled={cambiando}
              >
                {cambiando ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}