import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../api/axios'
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, Typography, Alert
} from '@mui/material'

const COLOR_GRUPO = {
  GRUPO_1: '#c62828', GRUPO_2: '#1565c0', GRUPO_3: '#2e7d32'
}

const COLOR_ECU_TURNO = {
  'Libre':          '#9e9e9e',
  '14h00-21h00':    '#e65100',
  '07h00-14h00':    '#1565c0',
  '21h00-07h00':    '#4a148c'
}

export default function Calendario() {
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [datos, setDatos]                     = useState(null)
  const [cargando, setCargando]               = useState(false)
  const [error, setError]                     = useState('')

  const handleFechaClick = async (info) => {
    const fecha = info.dateStr
    setDiaSeleccionado(fecha)
    setCargando(true)
    setError('')
    setDatos(null)
    try {
      const res = await api.get(`/calendario/${fecha}`)
      setDatos(res.data)
    } catch {
      setError('Error al cargar datos del día')
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    const [y, m, d] = fecha.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>

      {/* Calendario izquierda */}
      <Box sx={{ width: 520, flexShrink: 0 }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          dateClick={handleFechaClick}
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  ''
          }}
          height={520}
          dayCellClassNames={(arg) => {
            return arg.dateStr === diaSeleccionado ? ['dia-seleccionado'] : []
          }}
        />
        <style>{`
          .dia-seleccionado { background-color: #fff3e0 !important; }
          .fc-day:hover { background-color: #f5f5f5; cursor: pointer; }
        `}</style>
      </Box>

      {/* Panel derecha */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {!diaSeleccionado && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <Typography color="text.secondary">
              Selecciona un día en el calendario para ver el detalle
            </Typography>
          </Box>
        )}

        {cargando && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {datos && !cargando && (
          <Box>
            {/* Encabezado del día */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatearFecha(datos.fecha)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Operativo: ${datos.grupoOperativo.replace('_', ' ')}`}
                  sx={{ bgcolor: COLOR_GRUPO[datos.grupoOperativo], color: 'white', fontWeight: 'bold' }}
                />
                {datos.totalAusentes > 0 && (
                  <Chip
                    label={`${datos.totalAusentes} ausente(s)`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {/* ECU */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  ECU — Central de Radio
                </Typography>
                <Grid container spacing={1}>
                  {datos.personalEcu.map(emp => (
                    <Grid item xs={6} key={emp.id}>
                      <Box sx={{
                        p: 1, borderRadius: 1,
                        bgcolor: emp.ausente ? '#fff3e0' : '#f5f5f5',
                        border: '1px solid #e0e0e0'
                      }}>
                        <Typography variant="body2" fontWeight="bold">
                          {emp.nombre}
                          {emp.ausente && (
                            <Chip label="Ausente" size="small" color="warning" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.grupoEcu?.replace('_', ' ')} — {emp.rango}
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {emp.turnos.map(t => (
                            <Chip
                              key={t} label={t} size="small"
                              sx={{
                                bgcolor: COLOR_ECU_TURNO[t] || '#9e9e9e',
                                color: 'white', fontSize: 10
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Personal por estación */}
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Personal operativo por estación
            </Typography>
            {datos.porEstacion.length === 0 && (
              <Alert severity="info">No hay personal asignado a estaciones para este grupo</Alert>
            )}
            {datos.porEstacion.map(est => (
              <Card key={est.nombre} sx={{ mb: 1.5 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" mb={1}>
                    {est.nombre}
                  </Typography>
                  {est.personal.map(emp => (
                    <Box key={emp.id} sx={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', py: 0.5,
                      opacity: emp.ausente ? 0.6 : 1
                    }}>
                      <Box>
                        <Typography variant="body2">
                          {emp.nombre}
                          {emp.ausente && (
                            <Chip
                              label={emp.ausenciaInfo?.tipo || 'Ausente'}
                              size="small" color="warning"
                              sx={{ ml: 1, fontSize: 10 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.rango}
                        </Typography>
                      </Box>
                      <Chip
                        label={emp.ausente ? 'No disponible' : 'Disponible'}
                        size="small"
                        color={emp.ausente ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </Box>
                  ))}
                  {est.personal.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Sin personal asignado
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Administrativos */}
            {datos.personalAdmin.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  Personal administrativo
                </Typography>
                {datos.personalAdmin.map(emp => (
                  <Box key={emp.id} sx={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', py: 0.5, px: 1,
                    bgcolor: '#f5f5f5', borderRadius: 1, mb: 0.5
                  }}>
                    <Box>
                      <Typography variant="body2">{emp.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {emp.rango} — {emp.estacion?.nombre || 'Sin estación'}
                      </Typography>
                    </Box>
                    <Chip
                      label={emp.ausente ? 'Ausente' : 'Activo'}
                      size="small"
                      color={emp.ausente ? 'warning' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}