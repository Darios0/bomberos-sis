import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../api/axios'
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Divider, Typography, Alert, Collapse, IconButton
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { getColorTiempoEstacion, calcularMesesConsecutivos } from '../utils/colorEstacion'

const COLOR_GRUPO = {
  GRUPO_1: { bg: '#c62828', label: 'Grupo 1' },
  GRUPO_2: { bg: '#1565c0', label: 'Grupo 2' },
  GRUPO_3: { bg: '#2e7d32', label: 'Grupo 3' }
}

const COLOR_ECU_TURNO = {
  'Libre':          '#9e9e9e',
  '14h00-21h00':    '#e65100',
  '07h00-14h00':    '#1565c0',
  '21h00-07h00':    '#4a148c'
}

const COLOR_AUSENCIA = {
  VACACIONES: '#f57c00',
  ENFERMEDAD: '#d32f2f',
  PERMISO:    '#0288d1',
  FALTA:      '#7b1fa2',
  ATRASO:     '#455a64'
}

// ── Tarjeta de persona ─────────────────────────────────────────
function TarjetaPersona({ emp, esAdmin, estacionId }) {
  const tieneReemplazo = !!emp.reemplazo

  const meses = estacionId && !tieneReemplazo && !emp.ausente
    ? calcularMesesConsecutivos(emp.historialEstaciones || [], estacionId)
    : 0
  const colorInfo = getColorTiempoEstacion(meses)

const bgColor = tieneReemplazo ? '#f3e5f5' :
                emp.ausente    ? '#fff3e0' :
                emp.esParamedico ? '#fce4ec' : 'transparent'

const borderColor = tieneReemplazo ? '#ce93d8' :
                    emp.ausente    ? '#ffcc02' :
                    emp.esParamedico ? '#e91e63' : 'transparent'

  return (
    <Box sx={{ mb: 0.3 }}>
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', py: 0.4, px: 0.5,
        borderRadius: 0.5,
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{
              fontWeight: 500, fontSize: 11,
              color: emp.ausente || tieneReemplazo ? '#7b1fa2' :
                     colorInfo ? colorInfo.texto : 'text.primary',
              textDecoration: emp.ausente || tieneReemplazo ? 'line-through' : 'none'
            }}>
              {emp.nombre}
            </Typography>
            {esAdmin && (
              <Chip label="Adm." size="small"
                sx={{ fontSize: 9, height: 14, bgcolor: '#bbdefb', color: '#0d47a1' }} />
            )}
            {emp.esParamedico && (
  <Chip label="Param." size="small"
    sx={{ fontSize: 8, height: 14, bgcolor: '#e91e63', color: 'white' }} />
)}
            {emp.ausente && emp.ausenciaInfo && (
              <Chip label={emp.ausenciaInfo.tipo} size="small"
                sx={{ fontSize: 9, height: 14,
                  bgcolor: COLOR_AUSENCIA[emp.ausenciaInfo.tipo] || '#9e9e9e',
                  color: 'white' }} />
            )}
            {tieneReemplazo && !emp.ausente && (
              <Chip label="Reemplazado" size="small"
                sx={{ fontSize: 9, height: 14, bgcolor: '#9c27b0', color: 'white' }} />
            )}
            {colorInfo && !emp.ausente && !tieneReemplazo && (
              <Chip label={colorInfo.label} size="small"
                sx={{ fontSize: 8, height: 14,
                  bgcolor: colorInfo.border, color: 'white' }} />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" fontSize={10}>
            {emp.rango}
            {emp.ausente && emp.ausenciaInfo?.horaInicio && (
              <span style={{ color: '#e65100' }}>
                {' '}· Permiso {emp.ausenciaInfo.horaInicio}–{emp.ausenciaInfo.horaFin}
              </span>
            )}
          </Typography>
        </Box>
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, mt: 0.5,
          bgcolor: emp.ausente || tieneReemplazo ? 'warning.main' : 'success.main'
        }} />
      </Box>

      {tieneReemplazo && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          py: 0.3, px: 0.5, ml: 1,
          borderRadius: 0.5, bgcolor: '#f3e5f5',
          border: '1px solid #ce93d8'
        }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#9c27b0', flexShrink: 0 }} />
          <Box>
            <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: '#6a1b9a' }}>
              {emp.reemplazo.empleadoReemplazo.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize={9} display="block">
              {emp.reemplazo.empleadoReemplazo.rango} · Reemplaza a {emp.nombre}
              {emp.reemplazo.motivo && ` — ${emp.reemplazo.motivo}`}
            </Typography>
          </Box>
          <Chip label="Reemplazo" size="small"
            sx={{ fontSize: 9, height: 14, bgcolor: '#9c27b0', color: 'white', ml: 'auto' }} />
        </Box>
      )}
    </Box>
  )
}

// ── Card de estación ───────────────────────────────────────────
function CardEstacion({ estacion }) {
  const [expandida, setExpandida] = useState(true)
  const todos        = [...estacion.operativos, ...estacion.administrativos]
  const totalAusentes  = todos.filter(e => e.ausente).length
  const totalDisponibles = todos.filter(e => !e.ausente).length
  const sinPersonal  = todos.length === 0

  return (
    <Card sx={{
      mb: 1, border: '1px solid',
      borderColor: totalAusentes > 0 ? 'warning.light' : 'divider',
      bgcolor: sinPersonal ? '#fafafa' : 'white'
    }}>
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', px: 1.5, py: 0.75,
        bgcolor: totalAusentes > 0 ? '#fff8e1' : '#f5f5f5',
        borderBottom: expandida ? '1px solid #e0e0e0' : 'none',
        cursor: 'pointer'
      }}
        onClick={() => setExpandida(e => !e)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" fontWeight="bold"
            textTransform="uppercase" fontSize={11}>
            {estacion.nombre}
          </Typography>
          <Chip
            label={`${totalDisponibles} disponible${totalDisponibles !== 1 ? 's' : ''}`}
            size="small" color="success"
            sx={{ height: 16, fontSize: 9 }}
          />
          {totalAusentes > 0 && (
            <Chip
              label={`${totalAusentes} ausente${totalAusentes !== 1 ? 's' : ''}`}
              size="small" color="warning"
              sx={{ height: 16, fontSize: 9 }}
            />
          )}
        </Box>
        <IconButton size="small" sx={{ p: 0 }}>
          {expandida ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expandida}>
        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
          {sinPersonal && (
            <Typography variant="caption" color="text.disabled" fontSize={10}>
              Sin personal asignado este mes
            </Typography>
          )}

          {/* Disponibles primero */}
          {estacion.operativos.filter(e => !e.ausente).map(emp => (
            <TarjetaPersona key={emp.id} emp={emp} esAdmin={false} />
          ))}
          {estacion.administrativos.filter(e => !e.ausente).map(emp => (
            <TarjetaPersona key={emp.id} emp={emp} esAdmin={true} />
          ))}

          {/* Ausentes al final con separador */}
          {totalAusentes > 0 && (
            <>
              <Divider sx={{ my: 0.5 }}>
                <Typography variant="caption" fontSize={9} color="warning.main">
                  AUSENTES
                </Typography>
              </Divider>
              {estacion.operativos.filter(e => e.ausente).map(emp => (
                <TarjetaPersona key={emp.id} emp={emp} esAdmin={false} />
              ))}
              {estacion.administrativos.filter(e => e.ausente).map(emp => (
                <TarjetaPersona key={emp.id} emp={emp} esAdmin={true} />
              ))}
            </>
          )}
        </CardContent>
      </Collapse>
    </Card>
  )
}

// ── Principal ──────────────────────────────────────────────────
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
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${d} de ${meses[parseInt(m)-1]} ${y}`
  }

  const grupoInfo = datos ? COLOR_GRUPO[datos.grupoOperativo] : null

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>

      {/* Calendario */}
      <Box sx={{ width: 480, flexShrink: 0 }}>
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
          height={480}
          dayCellClassNames={(arg) =>
            arg.dateStr === diaSeleccionado ? ['dia-seleccionado'] : []
          }
        />
        <style>{`
          .dia-seleccionado a, .dia-seleccionado { background-color: #fff3e0 !important; }
          .fc-day:hover { background-color: #f5f5f5; cursor: pointer; }
          .fc-button { background-color: #c62828 !important; border-color: #c62828 !important; }
          .fc-button:hover { background-color: #b71c1c !important; }
        `}</style>

        {/* Leyenda */}
        {datos && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
              Leyenda de ausencias
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(COLOR_AUSENCIA).map(([tipo, color]) => (
                <Chip key={tipo} label={tipo} size="small"
                  sx={{ bgcolor: color, color: 'white', fontSize: 10, height: 18 }} />
              ))}
              {/* Leyenda tiempo en estación */}
<Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
  <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
    Tiempo en estación
  </Typography>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    {[
      { label: '1 mes',    color: '#4caf50' },
      { label: '2 meses',  color: '#1565c0' },
      { label: '3 meses',  color: '#ef6c00' },
      { label: '+3 meses', color: '#c62828' },
    ].map(c => (
      <Chip key={c.label} label={c.label} size="small"
        sx={{ bgcolor: c.color, color: 'white', fontSize: 10, height: 18 }} />
    ))}
  </Box>
  <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
  <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
    Tipos de personal
  </Typography>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    <Chip label="Paramédico" size="small"
      sx={{ bgcolor: '#e91e63', color: 'white', fontSize: 10, height: 18 }} />
    <Chip label="Administrativo" size="small"
      sx={{ bgcolor: '#0288d1', color: 'white', fontSize: 10, height: 18 }} />
  </Box>
</Box>
</Box>
            </Box>
          </Box>
        )}
      </Box>
      

      {/* Panel detalle */}
      <Box sx={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {!diaSeleccionado && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <Typography color="text.secondary">
              Selecciona un día para ver el detalle
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
            <Box sx={{ mb: 2, p: 1.5, bgcolor: grupoInfo?.bg || '#9e9e9e', borderRadius: 1 }}>
              <Typography variant="h6" color="white" fontWeight="bold">
                {formatearFecha(datos.fecha)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label={grupoInfo?.label || datos.grupoOperativo}
                  sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold' }}
                  size="small"
                />
                {datos.totalAusentes > 0 && (
                  <Chip
                    label={`${datos.totalAusentes} ausente${datos.totalAusentes > 1 ? 's' : ''}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    size="small"
                  />
                )}
                {!datos.distributivoExiste && (
                  <Chip
                    label="Sin distributivo este mes"
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)', color: 'white' }}
                    size="small"
                  />
                )}
              </Box>
            </Box>

            {/* Advertencia si no hay distributivo */}
            {!datos.distributivoExiste && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay distributivo publicado para este mes. El personal que se muestra es el asignado en el último distributivo disponible.
              </Alert>
            )}

            {/* ECU */}
            <Card sx={{ mb: 2, border: '1px solid #f57c00' }}>
              <Box sx={{ px: 1.5, py: 0.75, bgcolor: '#fff8e1' }}>
                <Typography variant="caption" fontWeight="bold" color="#e65100" textTransform="uppercase">
                  Central ECU — 911
                </Typography>
              </Box>
              <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>

                {/* Jornada ordinaria */}
                {datos.personalEcu.filter(e => e.esJornadaEcu).length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="#6a1b9a" fontWeight="bold" display="block" mb={0.5}>
                      Jornada Ordinaria
                    </Typography>
                    {datos.personalEcu.filter(e => e.esJornadaEcu).map(emp => (
                      <TarjetaPersona key={emp.id} emp={emp} esAdmin={false} />
                    ))}
                    <Divider sx={{ mt: 0.5 }} />
                  </Box>
                )}

                {/* Grupos rotativos ECU */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                  {['ECU_1','ECU_2','ECU_3','ECU_4'].map(sg => {
                    const turnos  = datos.resumenEcu[sg] || ['Libre']
                    const personal = datos.personalEcu.filter(e => !e.esJornadaEcu && e.grupoEcu === sg)
                    const libre   = turnos[0] === 'Libre'
                    return (
                      <Box key={sg} sx={{
                        p: 0.75, borderRadius: 1,
                        border: '1px solid',
                        borderColor: libre ? '#e0e0e0' : '#f57c00',
                        bgcolor: libre ? '#fafafa' : '#fff8e1'
                      }}>
                        <Typography variant="caption" fontWeight="bold" display="block"
                          color={libre ? 'text.disabled' : '#e65100'} fontSize={10}>
                          {sg.replace('_',' ')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mb: 0.5 }}>
                          {turnos.map(t => (
                            <Chip key={t} label={t} size="small"
                              sx={{
                                fontSize: 9, height: 14,
                                bgcolor: COLOR_ECU_TURNO[t] || '#9e9e9e',
                                color: 'white'
                              }}
                            />
                          ))}
                        </Box>
                        {personal.map(emp => (
                          <TarjetaPersona key={emp.id} emp={emp} esAdmin={false} />
                        ))}
                        {personal.length === 0 && (
                          <Typography variant="caption" color="text.disabled" fontSize={9}>
                            Sin asignar
                          </Typography>
                        )}
                      </Box>
                    )
                  })}
                </Box>
              </CardContent>
            </Card>

            {/* Estaciones X1-X4 */}
            <Typography variant="caption" color="text.secondary" fontWeight="bold"
              display="block" mb={0.5} textTransform="uppercase">
          
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.5 }}>
              {datos.porEstacion.slice(0,4).map(est => (
                <CardEstacion key={est.id} estacion={est} />
              ))}
            </Box>

            {/* Estaciones X5-X8 */}
            <Typography variant="caption" color="text.secondary" fontWeight="bold"
              display="block" mb={0.5} textTransform="uppercase">
       
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.5 }}>
              {datos.porEstacion.slice(4,8).map(est => (
                <CardEstacion key={est.id} estacion={est} />
              ))}
            </Box>

            {/* Operativos en horario administrativo */}
            {datos.operativosAdmin.length > 0 && (
              <>
                <Typography variant="caption" color="info.main" fontWeight="bold"
                  display="block" mb={0.5} textTransform="uppercase">
                  Operativos horario administrativo
                </Typography>
                <Card sx={{ mb: 1.5, border: '1px solid', borderColor: 'info.light' }}>
                  <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {datos.operativosAdmin.map(emp => (
                        <Box key={emp.id} sx={{ minWidth: 150 }}>
                          <TarjetaPersona emp={emp} esAdmin={true} />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}

          </Box>
        )}
      </Box>
    </Box>
  )
}