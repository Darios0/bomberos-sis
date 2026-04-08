import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControl, InputLabel, MenuItem,
  Select, TextField, Typography, Alert, Tab, Tabs, IconButton
} from '@mui/material'

const TIPOS_AUSENCIA  = ['VACACIONES', 'ENFERMEDAD', 'PERMISO', 'FALTA', 'ATRASO']
const TIPOS_PERMISO   = ['Calamidad doméstica', 'Médico', 'Personal', 'Comisión de servicios', 'Otro']
const COLOR_AUSENCIA  = {
  VACACIONES: 'primary', ENFERMEDAD: 'warning',
  PERMISO: 'info', FALTA: 'error', ATRASO: 'secondary'
}
const COLOR_EVAL = { MERITO: 'success', DEMERITO: 'error' }

export default function EmpleadoDetalle({ empleado, onCerrar, onActualizar }) {
  const [tab, setTab]               = useState(0)
  const [ausencias, setAusencias]   = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])
  const [dialogoAus, setDialogoAus] = useState(false)
  const [dialogoEval, setDialogoEval] = useState(false)
  const [error, setError]           = useState('')

  const [formAus, setFormAus] = useState({
    tipo: 'PERMISO', fechaInicio: '', fechaFin: '',
    horaInicio: '', horaFin: '', descripcion: '', tipoPermiso: ''
  })
  const [formEval, setFormEval] = useState({ tipo: 'MERITO', descripcion: '' })

  const cargar = async () => {
    try {
      const [a, e] = await Promise.all([
        api.get(`/ausencias/empleado/${empleado.id}`),
        api.get(`/evaluaciones/empleado/${empleado.id}`)
      ])
      setAusencias(a.data)
      setEvaluaciones(e.data)
    } catch {}
  }

  useEffect(() => { if (empleado) cargar() }, [empleado])

  const guardarAusencia = async () => {
    if (!formAus.fechaInicio || !formAus.fechaFin) {
      setError('Las fechas son requeridas')
      return
    }
    try {
      await api.post('/ausencias', { ...formAus, empleadoId: empleado.id })
      setDialogoAus(false)
      setFormAus({ tipo: 'PERMISO', fechaInicio: '', fechaFin: '', horaInicio: '', horaFin: '', descripcion: '', tipoPermiso: '' })
      cargar()
      onActualizar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const guardarEval = async () => {
    if (!formEval.descripcion) {
      setError('La descripción es requerida')
      return
    }
    try {
      await api.post('/evaluaciones', { ...formEval, empleadoId: empleado.id })
      setDialogoEval(false)
      setFormEval({ tipo: 'MERITO', descripcion: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const eliminarAusencia = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return
    await api.delete(`/ausencias/${id}`)
    cargar()
    onActualizar()
  }

  const eliminarEval = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return
    await api.delete(`/evaluaciones/${id}`)
    cargar()
  }

  const hoy = new Date().toISOString().split('T')[0]

  const ausenciaActiva = ausencias.find(a => {
    const ini = new Date(a.fechaInicio).toISOString().split('T')[0]
    const fin = new Date(a.fechaFin).toISOString().split('T')[0]
    return ini <= hoy && fin >= hoy
  })

  if (!empleado) return null

  return (
    <Dialog open={!!empleado} onClose={onCerrar} fullWidth maxWidth="md">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">{empleado.nombre}</Typography>
            <Typography variant="caption" color="text.secondary">
              {empleado.rango} — {empleado.tipoPersonal}
              {empleado.grupoOperativo && ` — ${empleado.grupoOperativo.replace('_', ' ')}`}
              {empleado.grupoEcu       && ` — ${empleado.grupoEcu.replace('_', ' ')}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {ausenciaActiva && (
              <Chip
                label={ausenciaActiva.tipo}
                color={COLOR_AUSENCIA[ausenciaActiva.tipo]}
                size="small"
              />
            )}
            <Chip
              label={empleado.activo ? 'Activo' : 'Inactivo'}
              color={empleado.activo ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Ausencias y permisos" />
          <Tab label="Méritos y deméritos" />
        </Tabs>

        {/* TAB AUSENCIAS */}
        {tab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: '#c62828' }}
                onClick={() => { setError(''); setDialogoAus(true) }}
              >
                + Registrar
              </Button>
            </Box>
            {ausencias.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Sin registros de ausencias
              </Typography>
            )}
            {ausencias.map(a => {
              const ini = new Date(a.fechaInicio).toISOString().split('T')[0]
              const fin = new Date(a.fechaFin).toISOString().split('T')[0]
              const activa = ini <= hoy && fin >= hoy
              return (
                <Box key={a.id} sx={{
                  p: 1.5, mb: 1, borderRadius: 1,
                  border: `1px solid`,
                  borderColor: activa ? 'warning.main' : 'divider',
                  bgcolor: activa ? '#fff8e1' : '#fafafa'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Chip label={a.tipo} color={COLOR_AUSENCIA[a.tipo]} size="small" />
                        {activa && <Chip label="Activa" color="warning" size="small" variant="outlined" />}
                        {a.tipoPermiso && <Chip label={a.tipoPermiso} size="small" variant="outlined" />}
                      </Box>
                      <Typography variant="body2">
                        {new Date(a.fechaInicio).toLocaleDateString('es-EC')} →{' '}
                        {new Date(a.fechaFin).toLocaleDateString('es-EC')}
                        {a.horaInicio && ` | ${a.horaInicio} – ${a.horaFin}`}
                      </Typography>
                      {a.descripcion && (
                        <Typography variant="caption" color="text.secondary">{a.descripcion}</Typography>
                      )}
                    </Box>
                    <Button size="small" color="error" onClick={() => eliminarAusencia(a.id)}>
                      Eliminar
                    </Button>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}

        {/* TAB MERITOS */}
        {tab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: '#c62828' }}
                onClick={() => { setError(''); setDialogoEval(true) }}
              >
                + Registrar
              </Button>
            </Box>
            {evaluaciones.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Sin registros de méritos o deméritos
              </Typography>
            )}
            {evaluaciones.map(ev => (
              <Box key={ev.id} sx={{
                p: 1.5, mb: 1, borderRadius: 1,
                border: '1px solid',
                borderColor: ev.tipo === 'MERITO' ? 'success.main' : 'error.main',
                bgcolor: ev.tipo === 'MERITO' ? '#f1f8e9' : '#fce4ec'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Chip
                      label={ev.tipo}
                      color={COLOR_EVAL[ev.tipo]}
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="body2">{ev.descripcion}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(ev.fecha).toLocaleDateString('es-EC')}
                    </Typography>
                  </Box>
                  <Button size="small" color="error" onClick={() => eliminarEval(ev.id)}>
                    Eliminar
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCerrar}>Cerrar</Button>
      </DialogActions>

      {/* Dialogo ausencia */}
      <Dialog open={dialogoAus} onClose={() => setDialogoAus(false)} fullWidth maxWidth="sm">
        <DialogTitle>Registrar ausencia o permiso</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo</InputLabel>
            <Select value={formAus.tipo} label="Tipo"
              onChange={e => setFormAus({ ...formAus, tipo: e.target.value })}>
              {TIPOS_AUSENCIA.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          {formAus.tipo === 'PERMISO' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de permiso</InputLabel>
              <Select value={formAus.tipoPermiso} label="Tipo de permiso"
                onChange={e => setFormAus({ ...formAus, tipoPermiso: e.target.value })}>
                {TIPOS_PERMISO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Fecha inicio" type="date" fullWidth margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formAus.fechaInicio}
              onChange={e => setFormAus({ ...formAus, fechaInicio: e.target.value })}
            />
            <TextField
              label="Fecha fin" type="date" fullWidth margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formAus.fechaFin}
              onChange={e => setFormAus({ ...formAus, fechaFin: e.target.value })}
            />
          </Box>

          {(formAus.tipo === 'PERMISO' || formAus.tipo === 'ATRASO') && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Hora inicio" type="time" fullWidth margin="normal"
                InputLabelProps={{ shrink: true }}
                value={formAus.horaInicio}
                onChange={e => setFormAus({ ...formAus, horaInicio: e.target.value })}
              />
              <TextField
                label="Hora fin" type="time" fullWidth margin="normal"
                InputLabelProps={{ shrink: true }}
                value={formAus.horaFin}
                onChange={e => setFormAus({ ...formAus, horaFin: e.target.value })}
              />
            </Box>
          )}

          <TextField
            label="Descripción / observación"
            fullWidth multiline rows={3} margin="normal"
            value={formAus.descripcion}
            onChange={e => setFormAus({ ...formAus, descripcion: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAus(false)}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardarAusencia}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo mérito/demérito */}
      <Dialog open={dialogoEval} onClose={() => setDialogoEval(false)} fullWidth maxWidth="sm">
        <DialogTitle>Registrar mérito o demérito</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo</InputLabel>
            <Select value={formEval.tipo} label="Tipo"
              onChange={e => setFormEval({ ...formEval, tipo: e.target.value })}>
              <MenuItem value="MERITO">Mérito</MenuItem>
              <MenuItem value="DEMERITO">Demérito</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Descripción" fullWidth multiline rows={4} margin="normal"
            value={formEval.descripcion}
            onChange={e => setFormEval({ ...formEval, descripcion: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoEval(false)}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardarEval}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}