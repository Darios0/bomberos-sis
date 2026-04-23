import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  FormControl, InputLabel, MenuItem, Select, Tab, Tabs,
  TextField, Typography, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Divider
} from '@mui/material'

const TIPOS_AUSENCIA = ['VACACIONES','ENFERMEDAD','PERMISO','FALTA','ATRASO']
const GRUPOS = ['GRUPO_1','GRUPO_2','GRUPO_3']
const COLOR_AUSENCIA = {
  VACACIONES: '#f57c00', ENFERMEDAD: '#d32f2f',
  PERMISO: '#0288d1', FALTA: '#7b1fa2', ATRASO: '#455a64'
}

export default function Reportes() {
  const [tab, setTab]               = useState(0)
  const [cargando, setCargando]     = useState(false)
  const [datos, setDatos]           = useState([])
  const [empleados, setEmpleados]   = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [error, setError]           = useState('')

  // Filtros ausencias
  const [filtroAus, setFiltroAus] = useState({
    fechaInicio: '', fechaFin: '', tipo: '', grupo: ''
  })

  // Filtros historial
  const [filtroHist, setFiltroHist] = useState({
    empleadoId: '', estacionId: ''
  })

  // Filtros evaluaciones
  const [filtroEval, setFiltroEval] = useState({
    tipo: '', grupo: '', fechaInicio: '', fechaFin: ''
  })

  // Resumen empleado
  const [empleadoId, setEmpleadoId]   = useState('')
  const [resumen, setResumen]         = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/empleados'),
      api.get('/estaciones')
    ]).then(([e, est]) => {
      setEmpleados(e.data)
      setEstaciones(est.data)
    })
  }, [])

  const buscarAusencias = async () => {
    setCargando(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filtroAus.fechaInicio) params.append('fechaInicio', filtroAus.fechaInicio)
      if (filtroAus.fechaFin)    params.append('fechaFin',    filtroAus.fechaFin)
      if (filtroAus.tipo)        params.append('tipo',        filtroAus.tipo)
      if (filtroAus.grupo)       params.append('grupo',       filtroAus.grupo)
      const res = await api.get(`/reportes/ausencias?${params}`)
      setDatos(res.data)
    } catch { setError('Error al buscar ausencias') }
    finally { setCargando(false) }
  }

  const buscarHistorial = async () => {
    setCargando(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filtroHist.empleadoId) params.append('empleadoId', filtroHist.empleadoId)
      if (filtroHist.estacionId) params.append('estacionId', filtroHist.estacionId)
      const res = await api.get(`/reportes/historial-estaciones?${params}`)
      setDatos(res.data)
    } catch { setError('Error al buscar historial') }
    finally { setCargando(false) }
  }

  const buscarEvaluaciones = async () => {
    setCargando(true); setError('')
    try {
      const params = new URLSearchParams()
      if (filtroEval.tipo)        params.append('tipo',        filtroEval.tipo)
      if (filtroEval.grupo)       params.append('grupo',       filtroEval.grupo)
      if (filtroEval.fechaInicio) params.append('fechaInicio', filtroEval.fechaInicio)
      if (filtroEval.fechaFin)    params.append('fechaFin',    filtroEval.fechaFin)
      const res = await api.get(`/reportes/evaluaciones?${params}`)
      setDatos(res.data)
    } catch { setError('Error al buscar evaluaciones') }
    finally { setCargando(false) }
  }

  const buscarResumen = async () => {
    if (!empleadoId) return
    setCargando(true); setError('')
    try {
      const res = await api.get(`/reportes/resumen-empleado/${empleadoId}`)
      setResumen(res.data)
    } catch { setError('Error al obtener resumen') }
    finally { setCargando(false) }
  }

  const descargarPDFReporte = async (tipo) => {
    const params = new URLSearchParams()
    if (tipo === 'ausencias') {
      if (filtroAus.fechaInicio) params.append('fechaInicio', filtroAus.fechaInicio)
      if (filtroAus.fechaFin)    params.append('fechaFin',    filtroAus.fechaFin)
      if (filtroAus.tipo)        params.append('tipo',        filtroAus.tipo)
      if (filtroAus.grupo)       params.append('grupo',       filtroAus.grupo)
    }
    window.open(`http://localhost:3001/api/pdf/reporte/${tipo}?${params}`, '_blank')
  }

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-EC') : '—'

  const duracionTexto = (dias) => {
    const anios = Math.floor(dias / 365)
    const meses = Math.floor((dias % 365) / 30)
    const d     = dias % 30
    if (anios > 0) return `${anios}a ${meses}m`
    if (meses > 0) return `${meses}m ${d}d`
    return `${dias}d`
  }

  const cambiarTab = (v) => {
    setTab(v); setDatos([]); setResumen(null); setError('')
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>Reportes RRHH</Typography>

      <Tabs value={tab} onChange={(_, v) => cambiarTab(v)} sx={{ mb: 2 }}>
        <Tab label="Ausencias" />
        <Tab label="Historial de estaciones" />
        <Tab label="Méritos y deméritos" />
        <Tab label="Resumen por empleado" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── AUSENCIAS ── */}
      {tab === 0 && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>Filtros</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField label="Fecha inicio" type="date" size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filtroAus.fechaInicio}
                  onChange={e => setFiltroAus({ ...filtroAus, fechaInicio: e.target.value })}
                  sx={{ minWidth: 160 }}
                />
                <TextField label="Fecha fin" type="date" size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filtroAus.fechaFin}
                  onChange={e => setFiltroAus({ ...filtroAus, fechaFin: e.target.value })}
                  sx={{ minWidth: 160 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={filtroAus.tipo} label="Tipo"
                    onChange={e => setFiltroAus({ ...filtroAus, tipo: e.target.value })}>
                    <MenuItem value="">Todos</MenuItem>
                    {TIPOS_AUSENCIA.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Grupo</InputLabel>
                  <Select value={filtroAus.grupo} label="Grupo"
                    onChange={e => setFiltroAus({ ...filtroAus, grupo: e.target.value })}>
                    <MenuItem value="">Todos</MenuItem>
                    {GRUPOS.map(g => <MenuItem key={g} value={g}>{g.replace('_',' ')}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={buscarAusencias}>
                  Buscar
                </Button>
                {datos.length > 0 && (
                  <Button variant="outlined" color="error"
                    onClick={() => descargarPDFReporte('ausencias')}>
                    Descargar PDF
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {cargando && <CircularProgress />}

          {datos.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                {datos.length} registro{datos.length !== 1 ? 's' : ''} encontrado{datos.length !== 1 ? 's' : ''}
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><b>Empleado</b></TableCell>
                      <TableCell><b>Rango</b></TableCell>
                      <TableCell><b>Grupo</b></TableCell>
                      <TableCell><b>Tipo</b></TableCell>
                      <TableCell><b>Desde</b></TableCell>
                      <TableCell><b>Hasta</b></TableCell>
                      <TableCell><b>Días</b></TableCell>
                      <TableCell><b>Detalle</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datos.map(a => {
                      const dias = Math.round(
                        (new Date(a.fechaFin) - new Date(a.fechaInicio)) / 86400000
                      ) + 1
                      return (
                        <TableRow key={a.id} hover>
                          <TableCell>{a.empleado.nombre}</TableCell>
                          <TableCell>{a.empleado.rango}</TableCell>
                          <TableCell>
                            {a.empleado.grupoOperativo
                              ? a.empleado.grupoOperativo.replace('_',' ')
                              : a.empleado.tipoPersonal}
                          </TableCell>
                          <TableCell>
                            <Chip label={a.tipo} size="small"
                              sx={{ bgcolor: COLOR_AUSENCIA[a.tipo], color: 'white', fontSize: 10 }} />
                          </TableCell>
                          <TableCell>{formatFecha(a.fechaInicio)}</TableCell>
                          <TableCell>{formatFecha(a.fechaFin)}</TableCell>
                          <TableCell>{dias}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {a.tipoPermiso || a.descripcion || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          {datos.length === 0 && !cargando && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Usa los filtros para buscar ausencias
            </Typography>
          )}
        </Box>
      )}

      {/* ── HISTORIAL ESTACIONES ── */}
      {tab === 1 && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>Filtros</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Empleado</InputLabel>
                  <Select value={filtroHist.empleadoId} label="Empleado"
                    onChange={e => setFiltroHist({ ...filtroHist, empleadoId: e.target.value })}>
                    <MenuItem value="">Todos</MenuItem>
                    {empleados.map(e => (
                      <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Estación</InputLabel>
                  <Select value={filtroHist.estacionId} label="Estación"
                    onChange={e => setFiltroHist({ ...filtroHist, estacionId: e.target.value })}>
                    <MenuItem value="">Todas</MenuItem>
                    {estaciones.map(e => (
                      <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={buscarHistorial}>
                  Buscar
                </Button>
              </Box>
            </CardContent>
          </Card>

          {cargando && <CircularProgress />}

          {datos.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><b>Empleado</b></TableCell>
                    <TableCell><b>Rango</b></TableCell>
                    <TableCell><b>Grupo</b></TableCell>
                    <TableCell><b>Estación</b></TableCell>
                    <TableCell><b>Desde</b></TableCell>
                    <TableCell><b>Hasta</b></TableCell>
                    <TableCell><b>Duración</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.map(h => (
                    <TableRow key={h.id} hover>
                      <TableCell>{h.empleado.nombre}</TableCell>
                      <TableCell>{h.empleado.rango}</TableCell>
                      <TableCell>
                        {h.empleado.grupoOperativo?.replace('_',' ') || '—'}
                      </TableCell>
                      <TableCell>{h.estacion.nombre}</TableCell>
                      <TableCell>{formatFecha(h.fechaInicio)}</TableCell>
                      <TableCell>
                        {h.fechaFin ? formatFecha(h.fechaFin) : (
                          <Chip label="Actual" color="success" size="small" sx={{ fontSize: 10 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={duracionTexto(h.dias)} size="small"
                          color={h.dias > 365 ? 'warning' : 'default'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {datos.length === 0 && !cargando && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Usa los filtros para buscar historial de estaciones
            </Typography>
          )}
        </Box>
      )}

      {/* ── EVALUACIONES ── */}
      {tab === 2 && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>Filtros</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={filtroEval.tipo} label="Tipo"
                    onChange={e => setFiltroEval({ ...filtroEval, tipo: e.target.value })}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="MERITO">Méritos</MenuItem>
                    <MenuItem value="DEMERITO">Deméritos</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Grupo</InputLabel>
                  <Select value={filtroEval.grupo} label="Grupo"
                    onChange={e => setFiltroEval({ ...filtroEval, grupo: e.target.value })}>
                    <MenuItem value="">Todos</MenuItem>
                    {GRUPOS.map(g => <MenuItem key={g} value={g}>{g.replace('_',' ')}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Fecha inicio" type="date" size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filtroEval.fechaInicio}
                  onChange={e => setFiltroEval({ ...filtroEval, fechaInicio: e.target.value })}
                  sx={{ minWidth: 160 }}
                />
                <TextField label="Fecha fin" type="date" size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filtroEval.fechaFin}
                  onChange={e => setFiltroEval({ ...filtroEval, fechaFin: e.target.value })}
                  sx={{ minWidth: 160 }}
                />
                <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={buscarEvaluaciones}>
                  Buscar
                </Button>
              </Box>
            </CardContent>
          </Card>

          {cargando && <CircularProgress />}

          {datos.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><b>Empleado</b></TableCell>
                    <TableCell><b>Rango</b></TableCell>
                    <TableCell><b>Grupo</b></TableCell>
                    <TableCell><b>Tipo</b></TableCell>
                    <TableCell><b>Descripción</b></TableCell>
                    <TableCell><b>Fecha</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.map(ev => (
                    <TableRow key={ev.id} hover>
                      <TableCell>{ev.empleado.nombre}</TableCell>
                      <TableCell>{ev.empleado.rango}</TableCell>
                      <TableCell>{ev.empleado.grupoOperativo?.replace('_',' ') || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={ev.tipo}
                          color={ev.tipo === 'MERITO' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="caption">{ev.descripcion}</Typography>
                      </TableCell>
                      <TableCell>{formatFecha(ev.fecha)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {datos.length === 0 && !cargando && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Usa los filtros para buscar méritos y deméritos
            </Typography>
          )}
        </Box>
      )}

      {/* ── RESUMEN POR EMPLEADO ── */}
      {tab === 3 && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 250 }}>
                  <InputLabel>Seleccionar empleado</InputLabel>
                  <Select value={empleadoId} label="Seleccionar empleado"
                    onChange={e => setEmpleadoId(e.target.value)}>
                    {empleados.map(e => (
                      <MenuItem key={e.id} value={e.id}>{e.nombre} — {e.rango}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" sx={{ bgcolor: '#c62828' }}
                  onClick={buscarResumen} disabled={!empleadoId}>
                  Ver resumen
                </Button>
                {resumen && (
                  <Button variant="outlined" color="error"
                    onClick={() => window.open(
                      `http://localhost:3001/api/pdf/reporte/empleado/${empleadoId}`, '_blank'
                    )}>
                    Descargar PDF
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {cargando && <CircularProgress />}

          {resumen && (
            <Box>
              {/* Encabezado */}
              <Card sx={{ mb: 2, bgcolor: '#c62828' }}>
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                  <Typography variant="h6" color="white" fontWeight="bold">
                    {resumen.empleado.nombre}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.85)">
                    {resumen.empleado.rango} —{' '}
                    {resumen.empleado.grupoOperativo?.replace('_',' ') || resumen.empleado.tipoPersonal}
                    {resumen.empleado.estacion && ` — ${resumen.empleado.estacion.nombre}`}
                  </Typography>
                </CardContent>
              </Card>

              {/* Métricas */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2 }}>
                {[
                  { label: 'Vacaciones',   val: resumen.totalVacaciones,  color: '#f57c00' },
                  { label: 'Enfermedades', val: resumen.totalEnfermedades, color: '#d32f2f' },
                  { label: 'Permisos',     val: resumen.totalPermisos,     color: '#0288d1' },
                  { label: 'Faltas',       val: resumen.totalFaltas,       color: '#7b1fa2' },
                  { label: 'Atrasos',      val: resumen.totalAtrasos,      color: '#455a64' },
                  { label: 'Méritos',      val: resumen.totalMeritos,      color: '#2e7d32' },
                  { label: 'Deméritos',    val: resumen.totalDemeritos,    color: '#c62828' },
                  { label: 'Estaciones',   val: resumen.historial.length,  color: '#1565c0' },
                ].map(m => (
                  <Box key={m.label} sx={{
                    p: 1.5, borderRadius: 1, textAlign: 'center',
                    border: `2px solid ${m.color}20`,
                    bgcolor: `${m.color}10`
                  }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: m.color }}>
                      {m.val}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Historial de estaciones */}
              {resumen.historial.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                    Historial de estaciones
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell><b>Estación</b></TableCell>
                          <TableCell><b>Desde</b></TableCell>
                          <TableCell><b>Hasta</b></TableCell>
                          <TableCell><b>Duración</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.historial.map(h => (
                          <TableRow key={h.id}>
                            <TableCell>{h.estacion.nombre}</TableCell>
                            <TableCell>{formatFecha(h.fechaInicio)}</TableCell>
                            <TableCell>
                              {h.fechaFin ? formatFecha(h.fechaFin) : (
                                <Chip label="Actual" color="success" size="small" />
                              )}
                            </TableCell>
                            <TableCell>{duracionTexto(h.dias)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Últimas ausencias */}
              {resumen.ausencias.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                    Últimas ausencias
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell><b>Tipo</b></TableCell>
                          <TableCell><b>Desde</b></TableCell>
                          <TableCell><b>Hasta</b></TableCell>
                          <TableCell><b>Detalle</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.ausencias.slice(0, 10).map(a => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <Chip label={a.tipo} size="small"
                                sx={{ bgcolor: COLOR_AUSENCIA[a.tipo], color: 'white', fontSize: 10 }} />
                            </TableCell>
                            <TableCell>{formatFecha(a.fechaInicio)}</TableCell>
                            <TableCell>{formatFecha(a.fechaFin)}</TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {a.tipoPermiso || a.descripcion || '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Últimas evaluaciones */}
              {resumen.evaluaciones.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                    Méritos y deméritos
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell><b>Tipo</b></TableCell>
                          <TableCell><b>Descripción</b></TableCell>
                          <TableCell><b>Fecha</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.evaluaciones.map(ev => (
                          <TableRow key={ev.id}>
                            <TableCell>
                              <Chip label={ev.tipo}
                                color={ev.tipo === 'MERITO' ? 'success' : 'error'}
                                size="small" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{ev.descripcion}</Typography>
                            </TableCell>
                            <TableCell>{formatFecha(ev.fecha)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}

          {!resumen && !cargando && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Selecciona un empleado para ver su resumen completo
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}