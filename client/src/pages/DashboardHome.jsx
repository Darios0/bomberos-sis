import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, Typography, Alert
} from '@mui/material'

const COLOR_GRUPO = {
  GRUPO_1: { bg: '#c62828', label: 'Grupo 1' },
  GRUPO_2: { bg: '#1565c0', label: 'Grupo 2' },
  GRUPO_3: { bg: '#2e7d32', label: 'Grupo 3' }
}

const COLOR_ECU = {
  'Libre':       '#9e9e9e',
  '14h00-21h00': '#e65100',
  '07h00-14h00': '#1565c0',
  '21h00-07h00': '#4a148c'
}

const COLOR_URGENCIA = {
  NORMAL:     '#1565c0',
  URGENTE:    '#e65100',
  EMERGENCIA: '#b71c1c'
}

const COLOR_AUSENCIA = {
  VACACIONES: '#f57c00', ENFERMEDAD: '#d32f2f',
  PERMISO: '#0288d1', FALTA: '#7b1fa2', ATRASO: '#455a64'
}

function TarjetaMetrica({ valor, label, color, subtitulo }) {
  return (
    <Card sx={{ border: `2px solid ${color}20`, height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ color }}>
          {valor}
        </Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {label}
        </Typography>
        {subtitulo && (
          <Typography variant="caption" color="text.secondary">
            {subtitulo}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardHome() {
  const [datos, setDatos]     = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/dashboard/hoy')
      .then(res => setDatos(res.data))
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
      <CircularProgress />
    </Box>
  )
  if (error) return <Alert severity="error">{error}</Alert>
  if (!datos) return null

  const grupoInfo = COLOR_GRUPO[datos.grupoOperativo] || COLOR_GRUPO.GRUPO_1
  const fechaFormateada = new Date(datos.fecha + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <Box>
      {/* Encabezado del día */}
      <Box sx={{
        p: 2.5, borderRadius: 2, mb: 3,
        background: `linear-gradient(135deg, ${grupoInfo.bg} 0%, ${grupoInfo.bg}dd 100%)`,
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight="bold" textTransform="capitalize">
          {fechaFormateada}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={`Turno: ${grupoInfo.label}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 'bold' }}
          />
          {!datos.distributivoExiste && (
            <Chip
              label="Sin distributivo publicado"
              sx={{ bgcolor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: 11 }}
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Métricas principales */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, mb: 3 }}>
        <TarjetaMetrica
          valor={datos.totalDisponibles}
          label="Disponibles hoy"
          color="#2e7d32"
          subtitulo={`de ${datos.totalTurno} en turno`}
        />
        <TarjetaMetrica
          valor={datos.totalAusentes}
          label="Ausentes hoy"
          color={datos.totalAusentes > 0 ? '#f57c00' : '#9e9e9e'}
          subtitulo="con registro de ausencia"
        />
        <TarjetaMetrica
          valor={datos.reemplazos.length}
          label="Reemplazos activos"
          color={datos.reemplazos.length > 0 ? '#9c27b0' : '#9e9e9e'}
          subtitulo="registrados para hoy"
        />
        <TarjetaMetrica
          valor={datos.totalEmpleados}
          label="Total personal"
          color="#1565c0"
          subtitulo={`en ${datos.totalEstaciones} estaciones`}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>

        {/* Personal ausente */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Ausentes hoy
            </Typography>
            {datos.ausencias.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="success.main" fontWeight={500}>
                  ✓ Todo el personal disponible
                </Typography>
              </Box>
            ) : (
              datos.ausencias.map(a => (
                <Box key={a.id} sx={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', py: 0.5, px: 1,
                  bgcolor: '#fafafa', borderRadius: 1, mb: 0.5,
                  border: '1px solid #f0f0f0'
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {a.empleado.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.empleado.rango}
                    </Typography>
                  </Box>
                  <Chip
                    label={a.tipo} size="small"
                    sx={{
                      bgcolor: COLOR_AUSENCIA[a.tipo],
                      color: 'white', fontSize: 10
                    }}
                  />
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        {/* Reemplazos */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Reemplazos de hoy
            </Typography>
            {datos.reemplazos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Sin reemplazos registrados
                </Typography>
              </Box>
            ) : (
              datos.reemplazos.map(r => (
                <Box key={r.id} sx={{
                  p: 1, mb: 0.5, borderRadius: 1,
                  border: '1px solid #ce93d8', bgcolor: '#f3e5f5'
                }}>
                  <Typography variant="caption" display="block" color="#6a1b9a" fontWeight={600}>
                    {r.empleadoReemplazo.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reemplaza a {r.empleadoOriginal.nombre}
                    {r.estacion && ` en ${r.estacion.nombre}`}
                  </Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Personal por estación */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" mb={1.5}>
            Personal por estación — hoy
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}>
            {datos.porEstacion.map(est => (
              <Box key={est.id} sx={{
                p: 1, borderRadius: 1, border: '1px solid',
                borderColor: est.total === 0 ? '#e0e0e0' :
                             est.activos < est.total ? 'warning.light' : 'success.light',
                bgcolor: est.total === 0 ? '#fafafa' :
                         est.activos < est.total ? '#fff8e1' : '#f1f8e9'
              }}>
                <Typography variant="caption" fontWeight="bold" display="block"
                  textTransform="uppercase" fontSize={10} color="text.secondary">
                  {est.nombre}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  <Chip
                    label={`${est.activos} activo${est.activos !== 1 ? 's' : ''}`}
                    size="small" color="success"
                    sx={{ fontSize: 9, height: 16 }}
                  />
                  {est.total - est.activos > 0 && (
                    <Chip
                      label={`${est.total - est.activos} ausente${est.total - est.activos !== 1 ? 's' : ''}`}
                      size="small" color="warning"
                      sx={{ fontSize: 9, height: 16 }}
                    />
                  )}
                  {est.total === 0 && (
                    <Typography variant="caption" color="text.disabled" fontSize={9}>
                      Sin asignar
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* ECU hoy */}
      <Card sx={{ mb: 3, border: '1px solid #f57c00' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" mb={1.5} color="#e65100">
            Central ECU — 911
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}>
            {['ECU_1','ECU_2','ECU_3','ECU_4'].map(sg => {
              const turnos = datos.resumenEcu[sg] || ['Libre']
              const libre  = turnos[0] === 'Libre'
              return (
                <Box key={sg} sx={{
                  p: 1, borderRadius: 1, border: '1px solid',
                  borderColor: libre ? '#e0e0e0' : '#f57c00',
                  bgcolor: libre ? '#fafafa' : '#fff8e1'
                }}>
                  <Typography variant="caption" fontWeight="bold"
                    color={libre ? 'text.disabled' : '#e65100'} display="block" fontSize={10}>
                    {sg.replace('_',' ')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mt: 0.3 }}>
                    {turnos.map(t => (
                      <Chip key={t} label={t} size="small"
                        sx={{
                          fontSize: 9, height: 14,
                          bgcolor: COLOR_ECU[t] || '#9e9e9e',
                          color: 'white'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Notificaciones recientes */}
      {datos.notificaciones.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Notificaciones recientes
            </Typography>
            {datos.notificaciones.map(n => (
              <Box key={n.id} sx={{
                p: 1.5, mb: 1, borderRadius: 1,
                borderLeft: `4px solid ${COLOR_URGENCIA[n.urgencia] || '#1565c0'}`,
                bgcolor: '#fafafa', border: '1px solid #f0f0f0',
                borderLeftColor: COLOR_URGENCIA[n.urgencia]
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                  <Typography variant="body2" fontWeight={600}>{n.titulo}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label={n.urgencia} size="small"
                      sx={{
                        fontSize: 9, height: 16,
                        bgcolor: COLOR_URGENCIA[n.urgencia], color: 'white'
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {n.mensaje}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {new Date(n.creadoEn).toLocaleDateString('es-EC', {
                    day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}