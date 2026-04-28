import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem,
  Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Alert
} from '@mui/material'

import { exportarReemplazos } from '../utils/exportarExcel'

export default function Reemplazos() {
  const { usuario }       = useAuth()
  const [reemplazos, setReemplazos] = useState([])
  const [empleados, setEmpleados]   = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [cargando, setCargando]     = useState(true)
  const [dialogo, setDialogo]       = useState(false)
  const [error, setError]           = useState('')
  const [exito, setExito]           = useState('')
  const [filtroMes, setFiltroMes]   = useState(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`
  })

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    empleadoOriginalId: '',
    empleadoReemplazoId: '',
    estacionId: '',
    motivo: ''
  })

  const cargar = async () => {
    setCargando(true)
    try {
      const [anio, mes] = filtroMes.split('-')
      const [rRes, eRes, estRes] = await Promise.all([
        api.get(`/reemplazos?mes=${mes}&anio=${anio}`),
        api.get('/empleados'),
        api.get('/estaciones')
      ])
      setReemplazos(rRes.data)
      setEmpleados(eRes.data.filter(e => e.activo))
      setEstaciones(estRes.data)
    } catch {
      setError('Error al cargar reemplazos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [filtroMes])

  const guardar = async () => {
    if (!form.fecha || !form.empleadoOriginalId || !form.empleadoReemplazoId) {
      setError('Fecha y empleados son requeridos')
      return
    }
    if (form.empleadoOriginalId === form.empleadoReemplazoId) {
      setError('El empleado original y el reemplazo no pueden ser el mismo')
      return
    }
    try {
      await api.post('/reemplazos', { ...form, creadoPor: usuario.id })
      setExito('Reemplazo registrado correctamente')
      setTimeout(() => setExito(''), 3000)
      setDialogo(false)
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        empleadoOriginalId: '', empleadoReemplazoId: '',
        estacionId: '', motivo: ''
      })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar reemplazo')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este reemplazo?')) return
    try {
      await api.delete(`/reemplazos/${id}`)
      cargar()
    } catch {
      setError('Error al eliminar reemplazo')
    }
  }

  const nombreEmpleado = (id) =>
    empleados.find(e => e.id === parseInt(id))?.nombre || '—'

  if (cargando) return <Box sx={{ p: 4 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Reemplazos de personal
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Mes" type="month" size="small"
            InputLabelProps={{ shrink: true }}
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            sx={{ width: 160 }}
          />
          <Button variant="contained" sx={{ bgcolor: '#c62828' }}
            onClick={() => { setError(''); setDialogo(true) }}>
            + Registrar reemplazo
          </Button>
        </Box>
      </Box>

      {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}
      {error && !dialogo && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        Los reemplazos se muestran en el calendario del día correspondiente con color morado.
        Quedan registrados en el historial de RRHH.
      </Alert>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>Fecha</b></TableCell>
              <TableCell><b>Empleado original</b></TableCell>
              <TableCell><b>Reemplazado por</b></TableCell>
              <TableCell><b>Estación / Lugar</b></TableCell>
              <TableCell><b>Motivo</b></TableCell>
              <TableCell><b>Registrado</b></TableCell>
              <TableCell><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reemplazos.map(r => (
              <TableRow key={r.id} hover>
                <TableCell>
                  {new Date(r.fecha).toLocaleDateString('es-EC', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{r.empleadoOriginal.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.empleadoOriginal.rango}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#9c27b0' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#6a1b9a', fontWeight: 600 }}>
                        {r.empleadoReemplazo.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.empleadoReemplazo.rango}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {r.estacion?.nombre || (r.esEcu ? `ECU — ${r.grupoEcu?.replace('_',' ')}` : '—')}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{r.motivo || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.creadoEn).toLocaleDateString('es-EC')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button size="small" color="error" onClick={() => eliminar(r.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {reemplazos.length > 0 && (
  <Button variant="outlined" color="success"
    onClick={() => {
      const [anio, mes] = filtroMes.split('-')
      exportarReemplazos(reemplazos, parseInt(mes) - 1, parseInt(anio))
    }}>
    Excel
  </Button>
)}
            {reemplazos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No hay reemplazos registrados este mes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogo nuevo reemplazo */}
      <Dialog open={dialogo} onClose={() => setDialogo(false)} fullWidth maxWidth="sm">
        <DialogTitle>Registrar reemplazo</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Fecha del reemplazo" type="date" fullWidth margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Empleado que será reemplazado</InputLabel>
            <Select value={form.empleadoOriginalId}
              label="Empleado que será reemplazado"
              onChange={e => setForm({ ...form, empleadoOriginalId: e.target.value })}>
              {empleados.map(e => (
                <MenuItem key={e.id} value={e.id}>
                  {e.nombre} — {e.rango}
                  {e.grupoOperativo && ` (${e.grupoOperativo.replace('_',' ')})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Empleado que reemplaza</InputLabel>
            <Select value={form.empleadoReemplazoId}
              label="Empleado que reemplaza"
              onChange={e => setForm({ ...form, empleadoReemplazoId: e.target.value })}>
              {empleados
                .filter(e => e.id !== parseInt(form.empleadoOriginalId))
                .map(e => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.nombre} — {e.rango}
                    {e.grupoOperativo && ` (${e.grupoOperativo.replace('_',' ')})`}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Estación (opcional)</InputLabel>
            <Select value={form.estacionId} label="Estación (opcional)"
              onChange={e => setForm({ ...form, estacionId: e.target.value })}>
              <MenuItem value="">Sin especificar</MenuItem>
              {estaciones.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Motivo del reemplazo" fullWidth margin="normal"
            multiline rows={2}
            placeholder="Ej: Vacaciones, enfermedad, permiso..."
            value={form.motivo}
            onChange={e => setForm({ ...form, motivo: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogo(false); setError('') }}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#c62828' }} onClick={guardar}>
            Guardar reemplazo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}